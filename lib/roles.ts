import { SessionData } from "@auth0/nextjs-auth0/types"

type NonNullUser = NonNullable<SessionData["user"]>
export type OrgNonNullUser = Omit<NonNullUser, "org_id"> & { org_id: string }

export type OrgSession = Omit<SessionData, "user"> & {
  user: OrgNonNullUser
}

export const roles = {
  member: process.env.AUTH0_MEMBER_ROLE_ID,
  admin: process.env.AUTH0_ADMIN_ROLE_ID,
}

export type Role = keyof typeof roles

export function getRole(user: OrgNonNullUser) {
  // we only allow a single role to be assigned to a user
  const role = user.roles && user.roles[0]

  // if no role is assigned, set them to the default member role
  return role || "member"
}
