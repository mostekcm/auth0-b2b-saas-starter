import { NextRequest, NextResponse } from "next/server"

import { appClient, onboardingClient } from "./lib/auth0"

export function buildAbsoluteRedirect(
  req: NextRequest,
  path: string,
  searchParams?: URLSearchParams
): URL {
  const { protocol, hostname, port } = new URL(req.url)

  const origin = port
    ? `${protocol}//${hostname}:${port}`
    : `${protocol}//${hostname}`

  const url = new URL(path, origin)

  if (searchParams) {
    url.search = searchParams.toString()
  }

  return url
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/auth")) {
    if (request.nextUrl.searchParams.get("onboarding")) {
      const onboardingMiddleware = await onboardingClient.middleware(request)
      return onboardingMiddleware
    }

    const authRes = await appClient.middleware(request)
    return authRes
  }

  // authentication routes — let the middleware handle it
  if (request.nextUrl.pathname.startsWith("/onboarding")) {
    if (request.nextUrl.pathname.startsWith("/onboarding/auth/callback")) {
      const searchParams = request.nextUrl.searchParams

      const params = new URLSearchParams(request.nextUrl.search)
      params.set("onboarding", "true")

      return NextResponse.redirect(
        buildAbsoluteRedirect(request, "/auth/callback", params)
      )
    } else if (request.nextUrl.pathname.startsWith("/onboarding/signup")) {
      const searchParams = request.nextUrl.searchParams
      const loginHint = searchParams.get("login_hint") || "baduser@example.com"

      const params = new URLSearchParams({
        login_hint: loginHint,
        screen_hint: "signup",
        returnTo: "/onboarding/verify",
        onboarding: "true",
      })

      return NextResponse.redirect(
        buildAbsoluteRedirect(request, "/auth/login", params)
      )
    }

    const onboardingMiddleware = await onboardingClient.middleware(request)
    return onboardingMiddleware
  }

  const authRes = await appClient.middleware(request)
  return authRes
}
