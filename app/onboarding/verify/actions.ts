"use server"

import { redirect } from "next/navigation"

import { onboardingClient } from "@/lib/auth0"
import { managementClient } from "@/lib/managementClient"

export async function resendVerificationEmail() {
  const session = await onboardingClient.getSession()

  if (!session) {
    return redirect("/onboarding/signup")
  }

  try {
    await managementClient.jobs.verifyEmail({
      user_id: session.user.sub,
    })

    return {}
  } catch (error) {
    console.error("failed to resend verification e-mail", error)
    return {
      error: "Failed to resend verification e-mail.",
    }
  }
}
