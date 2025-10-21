"use server"

import {
  getOrganizationEntitlements,
  updateEntitlementUsage,
} from "@/lib/salesforce-api"

export interface SendCampaignData {
  sfOrgId: string
  groupSize: number
  subject: string
  emailBody: string
  groupName: string
}

export async function sendEmailCampaignAction(data: SendCampaignData) {
  try {
    // Get current entitlements to find the NumberofEmailsPerDay entitlement
    const entitlements = await getOrganizationEntitlements(data.sfOrgId)

    if (!entitlements) {
      throw new Error("Failed to fetch entitlements")
    }

    // Find the NumberofEmailsPerDay entitlement
    let emailEntitlement = null
    let emailEntitlementId = ""

    // Search through all products and categories to find the email entitlement
    for (const productName in entitlements) {
      const categories = entitlements[productName]
      for (const categoryName in categories) {
        const entitlementList = categories[categoryName]
        const found = entitlementList.find(
          (e) => e.developerName === "NumberofEmailsPerDay"
        )
        if (found) {
          emailEntitlement = found
          emailEntitlementId = found.id
          break
        }
      }
      if (emailEntitlement) break
    }

    if (!emailEntitlement || !emailEntitlementId) {
      throw new Error("Email entitlement not found")
    }

    // Check if we have enough emails remaining
    const currentUsage = emailEntitlement.usage || 0
    const limit = emailEntitlement.featureLimit || 0
    const remaining = limit - currentUsage

    if (data.groupSize > remaining) {
      return {
        success: false,
        message: `You don't have enough emails remaining this month. You have ${remaining} emails left, but need ${data.groupSize} to send to this group.`,
        usage: currentUsage,
        limit: limit,
      }
    }

    // Update the usage by adding the number of emails being sent
    const newUsage = currentUsage + data.groupSize
    const updateResponse = await updateEntitlementUsage(
      data.sfOrgId,
      emailEntitlementId,
      newUsage
    )

    console.log(`Updated email usage for org ${data.sfOrgId}:`, updateResponse)

    return {
      success: true,
      message: `Your email campaign has been sent to ${data.groupSize} customers in the "${data.groupName}" group.`,
      usage: updateResponse.usage,
      limit: updateResponse.limit,
      remaining: updateResponse.limit - updateResponse.usage,
    }
  } catch (error) {
    console.error("Failed to send email campaign:", error)

    return {
      success: false,
      message: `Failed to send email campaign: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
