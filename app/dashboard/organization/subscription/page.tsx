import { CalendarIcon, CreditCardIcon, DollarSignIcon } from "lucide-react"

import { appClient, managementClient } from "@/lib/auth0"
import { getSkuBySalesforceId } from "@/lib/salesforce-api"
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
import { EntitlementsDisplay } from "./entitlements-display"

// Force dynamic rendering to avoid caching entitlements data
export const dynamic = "force-dynamic"
export const revalidate = 0

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

  // Get subscription details from organization metadata - use SKUs instead of subscription
  const skusJson = org.metadata?.skus
  let currentSku = null
  let isActive = false

  if (skusJson) {
    try {
      const skusArray = JSON.parse(skusJson)
      if (Array.isArray(skusArray) && skusArray.length > 0) {
        // Get the first SKU ID from the array
        const firstSkuId = skusArray[0]
        currentSku = await getSkuBySalesforceId(firstSkuId)
        isActive = !!currentSku
      }
    } catch (error) {
      console.error("Failed to parse SKUs metadata:", error)
    }
  }

  const subscriptionDate = org.metadata?.subscriptionDate

  // Format subscription display name based on SKU
  const getSubscriptionDisplayName = (sku: any) => {
    if (!sku) return "No Subscription"
    return sku.skuName
  }

  // Get plan display name for legacy compatibility
  const getLegacyPlanId = (sku: any) => {
    if (!sku) return "none"

    const name = sku.skuName.toLowerCase()
    if (name.includes("free") || name.includes("trial")) return "free_trial"
    if (name.includes("starter")) return "starter"
    if (name.includes("pro") || name.includes("professional")) return "pro"
    return "custom"
  }

  const legacyPlanId = getLegacyPlanId(currentSku)

  const formatPrice = (sku: any) => {
    if (!sku) return "N/A"

    if (sku.skuPricing.USD === 0) {
      return "FREE"
    }

    // Format annual value as monthly if needed
    const monthlyPrice = Math.round(sku.annualValue / 12)
    return sku.annualValue > 0 ? `$${monthlyPrice}` : `$${sku.skuPricing.USD}`
  }

  const getPriceNote = (sku: any) => {
    if (!sku) return ""

    if (sku.skuPricing.USD === 0) {
      return "14-day trial"
    }
    return "/month"
  }

  const getBadgeColor = (sku: any) => {
    if (!sku) return "bg-gray-100 text-gray-800"

    const name = sku.skuName.toLowerCase()
    if (name.includes("free") || name.includes("trial"))
      return "bg-green-100 text-green-800"
    if (name.includes("starter")) return "bg-blue-100 text-blue-800"
    if (name.includes("pro") || name.includes("professional"))
      return "bg-purple-100 text-purple-800"
    return "bg-blue-100 text-blue-800" // default
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Subscription${isActive ? ` - ${getSubscriptionDisplayName(currentSku)}` : ""}`}
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
            <Badge className={getBadgeColor(currentSku)}>
              {getSubscriptionDisplayName(currentSku)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isActive ? (
            <>
              {/* Plan Pricing Information */}
              <div className="flex items-start gap-4">
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(currentSku)}
                  </div>
                  <div className="mb-1 text-sm text-gray-500">
                    {getPriceNote(currentSku)}
                  </div>
                </div>
                {currentSku && (
                  <div className="mt-2 flex-1">
                    <div className="text-sm text-gray-600">
                      {currentSku.description}
                    </div>
                  </div>
                )}
              </div>

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

      {/* Entitlements Display */}
      {isActive && org.metadata?.sf_org_id && (
        <EntitlementsDisplay
          orgId={org.metadata.sf_org_id}
          memberCount={members.length}
        />
      )}

      {/* Trial Warning for Free Trial */}
      {legacyPlanId === "free_trial" && subscriptionDate && (
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
        currentSubscription={legacyPlanId}
        orgId={session.user.org_id}
      />
    </div>
  )
}
