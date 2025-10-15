"use client"

import React from "react"
import { useUser } from "@auth0/nextjs-auth0"

import { Spinner } from "./spinner"
import { SubscriptionSelectionScreen } from "./subscription-selection-screen"

interface SubscriptionGateProps {
  children: React.ReactNode
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  children,
}) => {
  const { user, isLoading, error } = useUser()

  // Show loading state while user data is being fetched
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Handle auth error
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Authentication Error
          </h2>
          <p className="text-gray-600">
            Please try refreshing the page or contact support.
          </p>
        </div>
      </div>
    )
  }

  // If no user, don't render anything (should be handled by Auth0 login flow)
  if (!user) {
    return null
  }

  // Check for subscription claim using the custom claims namespace from your env
  const customClaimsNamespace = "https://example.com" // From your .env.local CUSTOM_CLAIMS_NAMESPACE
  const subscription =
    user[`${customClaimsNamespace}/subscription`] || user.subscription

  // If subscription is null, empty string, or "none", show subscription selection
  if (!subscription || subscription === "" || subscription === "none") {
    return <SubscriptionSelectionScreen />
  }

  // User has valid subscription, render children
  return <>{children}</>
}