import { appClient } from "./auth0"
import { getRole, OrgSession, Role } from "./roles"

interface Options {
  role?: Role
}

/**
 * withServerActionAuth wraps a Server Action to ensure a user is authenticated.
 * Optionally, if a role is supplied, then the user must have that role to invoke the Server Action.
 */
export function withServerActionAuth<T extends any[], U extends any>(
  serverActionWithSession: (...args: [...T, session: OrgSession]) => U,
  options: Options
) {
  return async function (...args: T) {
    const session = await appClient.getOrgSession()

    if (!session) {
      return {
        error:
          "You must be authenticated with an org_id to perform this action.",
      }
    }

    if (options.role && getRole(session.user) !== options.role) {
      return {
        error: `You must be a(n) ${options.role} to perform this action.`,
      }
    }

    return serverActionWithSession(...args, session)
  }
}
export type { OrgSession }
