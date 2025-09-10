"use server"

import { verifyDnsRecords } from "@/lib/domain-verification"
import { createIdentityProvider } from "@/lib/org"
import { OrgSession, withServerActionAuth } from "@/lib/with-server-action-auth"

export const verifyDomain = withServerActionAuth(
  async function verifyDomain(domain: string, session: OrgSession) {
    if (!domain || typeof domain !== "string") {
      return {
        error: "Domain is required.",
      }
    }

    try {
      const verified = await verifyDnsRecords(domain, session.user.org_id)

      return { verified }
    } catch (error) {
      console.error("failed to validate the domain", error)
      return {
        error: "Failed to validate the domain.",
      }
    }
  },
  {
    role: "admin",
  }
)

export const getTicketUrl = withServerActionAuth(
  async function getTicketUrl(
    name: string,
    assign_membership_on_login: boolean,
    show_as_button: boolean,
    display_name: string | null,
    session: OrgSession
  ) {
    const payload = {
      name,
      assign_membership_on_login,
      show_as_button,
      display_name,
    }

    return await createIdentityProvider(payload)
  },
  { role: "admin" }
)
