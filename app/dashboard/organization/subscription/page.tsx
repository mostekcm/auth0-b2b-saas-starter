import { CalendarIcon, CreditCardIcon, MailIcon, UsersIcon } from "lucide-react"

import { appClient, managementClient } from "@/lib/auth0"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

import { ChangeSubscriptionForm } from "./change-subscription-form"
import { UsageStats } from "./usage-stats"

export default async function SubscriptionPage() {
  const session = await appClient.getSession()

  if (!session?.user?.org_id) {
    throw new Error("Organization ID not found")
  }

  const { data: org } = await managementClient.organizations.get({
    id: session.user.org_id,
  })

  // Get organization members count
  const { data: members } = await managementClient.organizations.getMembers({
    id: session.user.org_id,
    fields: ["user_id"].join(","),
    include_fields: true,
  })

  // Get subscription details from organization metadata
  const subscription = org.metadata?.subscription || "none"
  const subscriptionDate = org.metadata?.subscriptionDate

  // Format subscription display name
  const getSubscriptionDisplayName = (sub: string) => {
    switch (sub) {
      case "free_trial":
        return "Free Trial"
      case "starter":
        return "Starter"
      case "pro":
        return "Pro"
      default:
        return "No Subscription"
    }
  }

  // Get subscription details
  const getSubscriptionDetails = (sub: string) => {
    switch (sub) {
      case "free_trial":
        return {
          price: "FREE",
          priceNote: "14-day trial",
          users: "1 User",
          emails: "50 emails/month",
          color: "bg-green-100 text-green-800",
        }
      case "starter":
        return {
          price: "$30",
          priceNote: "/month",
          users: "5 Users",
          emails: "500 emails/month",
          color: "bg-blue-100 text-blue-800",
        }
      case "pro":
        return {
          price: "$100",
          priceNote: "/month",
          users: "20 Users",
          emails: "2000 emails/month",
          color: "bg-purple-100 text-purple-800",
        }
      default:
        return {
          price: "N/A",
          priceNote: "",
          users: "No access",
          emails: "No access",
          color: "bg-gray-100 text-gray-800",
        }
    }
  }

  const subscriptionDetails = getSubscriptionDetails(subscription)
  const isActive = subscription !== "none" && subscription !== ""

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Subscription${isActive ? ` - ${getSubscriptionDisplayName(subscription)}` : ""}`}
        description={`Manage ${org.display_name || org.name}&apos;s subscription and billing.`}
      />

      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your organization&apos;s current subscription status
              </CardDescription>
            </div>
            <Badge className={subscriptionDetails.color}>
              {getSubscriptionDisplayName(subscription)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isActive ? (
            <>
              <UsageStats
                orgId={session.user.org_id}
                subscription={subscription}
                memberCount={members.length}
              />

              {subscriptionDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    Subscribed on{" "}
                    {new Date(subscriptionDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
                <CreditCardIcon className="h-full w-full" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No Active Subscription
              </h3>
              <p className="mb-4 text-gray-600">
                You don&apos;t have an active subscription. Choose a plan to get
                started.
              </p>
              <Button>View Plans</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Features */}
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
            <CardDescription>
              Features included with your{" "}
              {getSubscriptionDisplayName(subscription)} plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {subscription === "free_trial" && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Basic Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Email Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>API Access</span>
                  </div>
                </>
              )}

              {subscription === "starter" && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Advanced Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Priority Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Team Collaboration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>API Access</span>
                  </div>
                </>
              )}

              {subscription === "pro" && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <span>Custom Integrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <span>24/7 Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <span>Advanced Security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <span>Unlimited API Access</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Warning for Free Trial */}
      {subscription === "free_trial" && subscriptionDate && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Trial Period</CardTitle>
            <CardDescription className="text-orange-700">
              Your free trial will expire in{" "}
              {Math.max(
                0,
                14 -
                  Math.floor(
                    (Date.now() - new Date(subscriptionDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
              )}{" "}
              days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-orange-700">
              Upgrade to a paid plan to continue using all features after your
              trial expires.
            </p>
            <Button
              variant="outline"
              className="border-orange-300 text-orange-800 hover:bg-orange-100"
            >
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Change Subscription Form */}
      <ChangeSubscriptionForm
        currentSubscription={subscription}
        orgId={session.user.org_id}
      />
    </div>
  )
}
