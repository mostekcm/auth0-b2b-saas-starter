import { TokenSet } from "@auth0/nextjs-auth0/types"
import { MyOrgClient } from "auth0-myorg-ts-sdk"

import { appClient } from "./auth0"
import { MustAuthenticateToGetNewToken } from "./errors"
import { OrgSession } from "./roles"
import { getRequiredScopes } from "./scope-mapping"

async function accessToken(requiredScopes: string[]) {
  // This should be implemented inside nextJS, this is what we have to do if it's not
  const session: OrgSession | null = await appClient.getOrgSession()

  if (!session) throw new MustAuthenticateToGetNewToken("Missing session")

  const myOrgClientTokenSet: TokenSet | undefined =
    session?.myOrgClientTokenSet as TokenSet

  if (myOrgClientTokenSet && myOrgClientTokenSet.expiresAt > Date.now()) {
    const allExistingScopes = myOrgClientTokenSet.scope?.split(" ") || []

    // Check if all required scopes exist in the existing scopes
    const hasAllRequiredScopes = requiredScopes.every((scope) =>
      allExistingScopes.includes(scope)
    )

    if (hasAllRequiredScopes && myOrgClientTokenSet.accessToken) {
      return myOrgClientTokenSet.accessToken
    }

    // Token doesn't have all required scopes, need to refresh or re-authenticate
    console.log(
      `Missing required scopes. Required: ${requiredScopes.join(", ")}, Available: ${allExistingScopes.join(", ")}`
    )
  }

  const refreshToken =
    myOrgClientTokenSet?.refreshToken || session.tokenSet?.refreshToken

  if (!refreshToken)
    throw new MustAuthenticateToGetNewToken("Missing refresh token")

  // Combine existing scopes with any missing required scopes
  const existingScopes = myOrgClientTokenSet?.scope?.split(" ") || []
  const missingScopes = requiredScopes.filter(
    (scope) => !existingScopes.includes(scope)
  )
  const allScopes = Array.from(new Set([...existingScopes, ...missingScopes]))

  try {
    const response = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "refresh_token",
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          refresh_token: refreshToken,
          audience: process.env.AUTH0_MY_ORG_AUDIENCE,
          scope: allScopes.join(" "),
        }),
      }
    )

    if (!response.ok) {
      throw new MustAuthenticateToGetNewToken(
        `Token refresh failed: ${response.status} ${response.statusText}`
      )
    }

    const tokenData = await response.json()

    const tokenDataSet: TokenSet = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      idToken: tokenData.id_token,
      expiresAt: tokenData.expires_in + Date.now(),
      scope: tokenData.scope,
    }

    if (tokenDataSet.refreshToken)
      session.tokenSet.refreshToken = tokenDataSet.refreshToken

    session.myOrgClientTokenSet = tokenDataSet

    await appClient.updateSession(session)

    return tokenDataSet.accessToken
  } catch (error) {
    console.error("❌ Token refresh failed:", error)
    throw new MustAuthenticateToGetNewToken("Failed to refresh token")
  }
}

// TODO: Consider whether we could pass the required scopes into the createFetcher call, or should we pass the accessToken and handle calling getAccessToken with it? Then we wouldn't need a fetcher...
function createFetcher(options?: {}) {
  return {
    fetchWithAuth: async (req: Request): Promise<Response> => {
      // Extract required scopes from the request URL and method
      const url = new URL(req.url)
      const method = req.method
      const path = url.pathname.replace(/^\/my-org/, "") // Remove base path if present

      // Get required scopes for this endpoint
      const requiredScopes = getRequiredScopes(method, path)

      console.log(`🔍 API call: ${method} ${path}`)
      console.log(`📋 Required scopes: ${requiredScopes.join(", ")}`)

      const token = await accessToken(requiredScopes)

      req.headers.set("Authorization", `Bearer ${token}`)

      return fetch(req)
    },
  }
}

export const myOrgServerClient = new MyOrgClient({
  domain: process.env.AUTH0_MY_ORG_AUDIENCE!,
  baseUrl: `${process.env.MY_ORG_API_BASE!}/my-org`,
  audience: process.env.AUTH0_MY_ORG_AUDIENCE!,
  createFetcher: createFetcher,
  useDpop: false,
  accessToken: "not used",
})
