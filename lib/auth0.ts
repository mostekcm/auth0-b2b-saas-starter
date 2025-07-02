import { redirect } from "next/navigation"
import { Auth0Client } from "@auth0/nextjs-auth0/server"
import jwt from "jsonwebtoken"

import { OrgSession } from "./with-server-action-auth"

export const onboardingClient = new Auth0Client({
  clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
  clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
  appBaseUrl: `${process.env.APP_BASE_URL}/onboarding`,
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  secret: process.env.SESSION_ENCRYPTION_SECRET,
  authorizationParameters: {},
})

class OrgAuth0Client extends Auth0Client {
  constructor(...args: ConstructorParameters<typeof Auth0Client>) {
    super(...args)
  }

  async getOrgSession(): Promise<OrgSession | null> {
    const session = await this.getSession()

    if (!session?.user?.org_id) {
      return null
    }

    return session as OrgSession
  }

  withPageAuthRequired(
    page: (session: OrgSession) => JSX.Element | Promise<JSX.Element>,
    options?: Record<string, string>
  ): () => Promise<JSX.Element> {
    return async () => {
      const session = await this.getOrgSession()

      if (!session) {
        const search = options
          ? `?${new URLSearchParams(options).toString()}}`
          : ""
        return redirect(`/auth/login${search}`)
      }

      return page(session)
    }
  }
}

const ROLES_CLAIM_KEY = `${process.env.CUSTOM_CLAIMS_NAMESPACE}/roles`

const getRolesFromIDToken = (idToken: string | null) => {
  if (!idToken) return null
  const decoded = jwt.decode(idToken)

  if (decoded && typeof decoded === "object") {
    return decoded[ROLES_CLAIM_KEY]
  }

  return null
}

export const appClient = new OrgAuth0Client({
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  secret: process.env.SESSION_ENCRYPTION_SECRET,
  // idpLogout: true,
  signInReturnToPath: "/dashboard",
  authorizationParameters: {
    scope:
      "openid profile email offline_access " +
      [
        "read:identity_providers",
        "create:sso_access_tickets",
        "read:members",
        "update:members",
        "read:member_roles",
        "update:member_roles",
        "create:member_invitations",
        "read:member_invitations",
        "delete:member_invitations",
      ].join(" "),
    audience: process.env.AUTH0_AUDIENCE,
  },
  async beforeSessionSaved(session, idToken) {
    return {
      ...session,
      user: {
        ...session.user,
        roles: getRolesFromIDToken(idToken),
      },
    }
  },
})
