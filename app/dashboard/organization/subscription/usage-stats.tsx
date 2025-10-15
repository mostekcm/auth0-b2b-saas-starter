"use client"

import { useEffect, useState } from "react"
import { CreditCardIcon, MailIcon, UsersIcon } from "lucide-react"

interface UsageStatsProps {
  orgId: string
  subscription: string
  memberCount: number
}

export function UsageStats({
  orgId,
  subscription,
  memberCount,
}: UsageStatsProps) {
  const [emailsSent, setEmailsSent] = useState(0)

  // Load emails sent from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem(`emailsSent_${orgId}`)
    if (stored) {
      setEmailsSent(parseInt(stored, 10))
    }
  }, [orgId])

  // Get subscription limits
  const getSubscriptionLimits = (sub: string) => {
    switch (sub) {
      case "free_trial":
        return { emails: 50, users: 1 }
      case "starter":
        return { emails: 500, users: 5 }
      case "pro":
        return { emails: 2000, users: 20 }
      default:
        return { emails: 0, users: 0 }
    }
  }

  const limits = getSubscriptionLimits(subscription)
  const remainingEmails = limits.emails - emailsSent
  const remainingUsers = limits.users - memberCount

  const isEmailOverLimit = emailsSent > limits.emails
  const isUserOverLimit = memberCount > limits.users

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
        <CreditCardIcon className="h-8 w-8 text-gray-600" />
        <div>
          <p className="text-sm font-medium text-gray-600">Price</p>
          <p className="text-lg font-bold">
            {subscription === "free_trial"
              ? "FREE"
              : subscription === "starter"
                ? "$30"
                : subscription === "pro"
                  ? "$100"
                  : "N/A"}
            <span className="text-sm font-normal text-gray-500">
              {subscription === "free_trial"
                ? " (14-day trial)"
                : subscription !== "none"
                  ? "/month"
                  : ""}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
        <UsersIcon
          className={`h-8 w-8 ${isUserOverLimit ? "text-red-500" : "text-gray-600"}`}
        />
        <div>
          <p className="text-sm font-medium text-gray-600">Users</p>
          <p
            className={`text-lg font-bold ${isUserOverLimit ? "text-red-600" : ""}`}
          >
            {memberCount} / {limits.users}
          </p>
          <p className="text-xs text-gray-500">
            {remainingUsers >= 0
              ? `${remainingUsers} remaining`
              : `${Math.abs(remainingUsers)} over limit`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
        <MailIcon
          className={`h-8 w-8 ${isEmailOverLimit ? "text-red-500" : "text-gray-600"}`}
        />
        <div>
          <p className="text-sm font-medium text-gray-600">Emails</p>
          <p
            className={`text-lg font-bold ${isEmailOverLimit ? "text-red-600" : ""}`}
          >
            {emailsSent.toLocaleString()} / {limits.emails.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            {remainingEmails >= 0
              ? `${remainingEmails.toLocaleString()} remaining`
              : `${Math.abs(remainingEmails).toLocaleString()} over limit`}{" "}
            this month
          </p>
        </div>
      </div>
    </div>
  )
}
