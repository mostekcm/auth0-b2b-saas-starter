import { appClient, managementClient } from "@/lib/auth0"
import {
  getActualEmailUsage,
  getOrganizationEntitlements,
  getSkuBySalesforceId,
} from "@/lib/salesforce-api"
import { PageHeader } from "@/components/page-header"

import { EmailCampaignForm } from "./email-campaign-form"

// Force dynamic rendering to avoid caching entitlements data
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardHome() {
  const session = await appClient.getSession()

  if (!session?.user?.org_id) {
    throw new Error("Organization ID not found")
  }

  const { data: org } = await managementClient.organizations.get({
    id: session.user.org_id,
  })

  const sfOrgId = org.metadata?.sf_org_id
  if (!sfOrgId) {
    throw new Error("Salesforce Organization ID not found")
  }

  // Get subscription details from organization metadata - use SKUs
  const skusJson = org.metadata?.skus
  let currentSku = null
  let legacyPlanId = "none"

  if (skusJson) {
    try {
      const skusArray = JSON.parse(skusJson)
      if (Array.isArray(skusArray) && skusArray.length > 0) {
        const firstSkuId = skusArray[0]
        currentSku = await getSkuBySalesforceId(firstSkuId)

        // Convert to legacy plan ID for email limits
        if (currentSku) {
          const name = currentSku.skuName.toLowerCase()
          if (name.includes("free") || name.includes("trial"))
            legacyPlanId = "free_trial"
          else if (name.includes("starter")) legacyPlanId = "starter"
          else if (name.includes("pro") || name.includes("professional"))
            legacyPlanId = "pro"
        }
      }
    } catch (error) {
      console.error("Failed to parse SKUs metadata:", error)
    }
  }

  // WORKAROUND: Get actual email usage by posting 0 to force refresh
  // This is needed because the GET endpoint doesn't return accurate usage
  const emailUsageData = await getActualEmailUsage(sfOrgId)

  let emailsSent = 0
  let emailLimit = 0

  if (emailUsageData) {
    emailsSent = emailUsageData.usage
    emailLimit = emailUsageData.limit
  } else {
    // Fallback to GET entitlements if workaround fails
    const entitlements = await getOrganizationEntitlements(sfOrgId)

    if (entitlements) {
      // Find the NumberofEmailsPerDay entitlement
      for (const productName in entitlements) {
        const categories = entitlements[productName]
        for (const categoryName in categories) {
          const entitlementList = categories[categoryName]
          const emailEntitlement = entitlementList.find(
            (e) => e.developerName === "NumberofEmailsPerDay"
          )
          if (emailEntitlement) {
            emailsSent = emailEntitlement.usage || 0
            emailLimit = emailEntitlement.featureLimit || 0
            break
          }
        }
        if (emailLimit > 0) break
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Campaigns"
        description="Create and send email campaigns to your customer groups."
      />

      <EmailCampaignForm
        sfOrgId={sfOrgId}
        subscription={legacyPlanId}
        emailLimit={emailLimit}
        initialEmailsSent={emailsSent}
      />
    </div>
  )
}
