"use server"

import { revalidatePath } from "next/cache"

import {
  assignMemberRoles,
  createMemberInvitation,
  getMemberRoles,
  removeMemberFromOrg,
  revokeMemberInvitation,
  revokeMemberRoles,
} from "@/lib/org"
import { OrgSession, Role, roles } from "@/lib/roles"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

export const createInvitation = withServerActionAuth(
  async function createInvitation(formData: FormData, session: OrgSession) {
    const email = formData.get("email")

    if (!email || typeof email !== "string") {
      return {
        error: "Email address is required.",
      }
    }

    const role = formData.get("role") as Role

    if (
      !role ||
      typeof role !== "string" ||
      !["member", "admin"].includes(role)
    ) {
      return {
        error: "Role is required and must be either 'member' or 'admin'.",
      }
    }

    try {
      const roleId = roles[role]

      // call orgs "SDK"
      await createMemberInvitation({
        roles: [roleId],
        invitee: {
          email,
        },
      })

      revalidatePath("/dashboard/organization/members")
    } catch (error) {
      console.error("failed to create invitation", error)
      return {
        error: "Failed to create invitation.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const revokeInvitation = withServerActionAuth(
  async function revokeInvitation(invitationId: string, session: OrgSession) {
    try {
      await revokeMemberInvitation(invitationId)

      revalidatePath("/dashboard/organization/members")
    } catch (error) {
      console.error("failed to revoke invitation", error)
      return {
        error: "Failed to revoke invitation.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const removeMember = withServerActionAuth(
  async function removeMember(userId: string, session: OrgSession) {
    if (userId === session.user.sub) {
      return {
        error: "You cannot remove yourself from an organization.",
      }
    }

    try {
      await removeMemberFromOrg(userId)

      revalidatePath("/dashboard/organization/members")
    } catch (error) {
      console.error("failed to remove member", error)
      return {
        error: "Failed to remove member.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const updateRole = withServerActionAuth(
  async function updateRole(userId: string, role: Role, session: OrgSession) {
    if (userId === session.user.sub) {
      return {
        error: "You cannot update your own role.",
      }
    }

    if (
      !role ||
      typeof role !== "string" ||
      !["member", "admin"].includes(role)
    ) {
      return {
        error: "Role is required and must be either 'member' or 'admin'.",
      }
    }

    const roleId = roles[role]

    try {
      const currentRoles = await getMemberRoles(userId)

      // if the user has any existing roles, remove them
      if (currentRoles.length) {
        await revokeMemberRoles(userId, currentRoles)
      }

      // if the user is being assigned a non-member role (non-null), set the new role
      if (roleId) {
        await assignMemberRoles(userId, [roleId])
      }

      revalidatePath("/dashboard/organization/members")
    } catch (error) {
      console.error("failed to update member's role", error)
      return {
        error: "Failed to update member's role.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)
