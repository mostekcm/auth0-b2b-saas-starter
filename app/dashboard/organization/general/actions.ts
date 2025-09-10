"use server"

import { revalidatePath } from "next/cache"

import { myOrgServerClient } from "@/lib/myOrgClient"
import { OrgSession, withServerActionAuth } from "@/lib/with-server-action-auth"

export const updateDisplayName = withServerActionAuth(
  async function updateDisplayName(formData: FormData, session: OrgSession) {
    const displayName = formData.get("display_name")

    if (!displayName || typeof displayName !== "string") {
      return {
        error: "Display name is required.",
      }
    }

    try {
      await myOrgServerClient.organizationDetails.update({
        display_name: displayName,
      })

      revalidatePath("/", "layout")
    } catch (error) {
      console.error("failed to update organization display name", error)
      return {
        error: "Failed to update the organization's display name.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)
