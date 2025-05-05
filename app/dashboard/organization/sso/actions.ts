"use server"

import { Session } from "@auth0/nextjs-auth0"

import { verifyDnsRecords } from "@/lib/domain-verification"
import { createIdentityProvider } from "@/lib/org"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

export const verifyDomain = withServerActionAuth(
  async function verifyDomain(domain: string, session: Session) {
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
    session: Session
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
