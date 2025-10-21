"use server"

import {
  EntitlementsResponse,
  ProductSkuResponse,
  UpdateUsageResponse,
} from "./salesforce-types"

// Base configuration
const SALESFORCE_BASE_URL =
  "https://acompany-2c-dev-ed.develop.my.salesforce-sites.com/services/apexrest"

// Generic function to make API calls to Salesforce
async function callSalesforceAPI(
  endpoint: string,
  options?: {
    method?: string
    body?: any
  }
): Promise<any> {
  try {
    const url = `${SALESFORCE_BASE_URL}${endpoint}`
    console.log(`Calling Salesforce API: ${url}`)

    const fetchOptions: RequestInit = {
      method: options?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        // TODO: Add authentication headers when needed
      },
    }

    // Add body for POST/PUT requests
    if (options?.body) {
      fetchOptions.body = JSON.stringify(options.body)
    }

    // Add cache revalidation for GET requests
    if (!options?.method || options.method === "GET") {
      fetchOptions.next = {
        revalidate: 300, // Cache for 5 minutes
      }
    }

    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      throw new Error(
        `Salesforce API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    console.log(`Salesforce API response:`, JSON.stringify(data, null, 2))

    return data
  } catch (error) {
    console.error(`Failed to call Salesforce API endpoint ${endpoint}:`, error)
    throw error
  }
}

// Server action to get product SKUs for a specific product and base
export async function getProductSkus(
  product: string = "saasstart",
  base: string = "base"
): Promise<ProductSkuResponse> {
  try {
    const endpoint = `/skus/product/${product}/${base}`
    const data = await callSalesforceAPI(endpoint)

    // Validate the response structure
    if (!Array.isArray(data)) {
      throw new Error("Invalid response format: expected array of SKUs")
    }

    return data as ProductSkuResponse
  } catch (error) {
    console.error("Failed to fetch product SKUs:", error)
    throw error
  }
}

// Server action to get a specific SKU by developer name
export async function getSkuByDeveloperName(
  developerName: string,
  product: string = "saasstart",
  base: string = "base"
): Promise<ProductSkuResponse[0] | null> {
  try {
    const skus = await getProductSkus(product, base)
    return skus.find((sku) => sku.developerName === developerName) || null
  } catch (error) {
    console.error(
      `Failed to fetch SKU by developer name ${developerName}:`,
      error
    )
    return null
  }
}

// Helper function to format pricing for display
export async function formatSkuPricing(
  sku: ProductSkuResponse[0]
): Promise<string> {
  if (sku.skuPricing.USD === 0) {
    return "FREE"
  }

  // Format annual value as monthly if needed
  const monthlyPrice = Math.round(sku.annualValue / 12)
  return sku.annualValue > 0 ? `$${monthlyPrice}` : `$${sku.skuPricing.USD}`
}

// Helper function to get pricing note
export async function getSkuPricingNote(
  sku: ProductSkuResponse[0]
): Promise<string> {
  if (sku.skuPricing.USD === 0) {
    return "14-day trial"
  }
  return "/month"
}

// Map subscription plan names to Salesforce developer names
const PLAN_NAME_TO_DEVELOPER_NAME: Record<string, string> = {
  "Free Trial": "SaaSStartFreeTrial",
  Starter: "SaaSStartStarter",
  Pro: "SaaSStartPro",
  Professional: "SaaSStartPro", // Handle both "Pro" and "Professional"
}

// Server action to get Salesforce ID by subscription plan name
export async function getSalesforceIdByPlanName(
  planName: string,
  product: string = "saasstart",
  base: string = "base"
): Promise<string | null> {
  try {
    const developerName = PLAN_NAME_TO_DEVELOPER_NAME[planName]
    if (!developerName) {
      console.error(`No mapping found for plan name: ${planName}`)
      return null
    }

    const sku = await getSkuByDeveloperName(developerName, product, base)
    return sku?.salesforceId || null
  } catch (error) {
    console.error(`Failed to get Salesforce ID for plan ${planName}:`, error)
    return null
  }
}

// Server action to get SKU details by subscription plan name
export async function getSkuByPlanName(
  planName: string,
  product: string = "saasstart",
  base: string = "base"
): Promise<ProductSkuResponse[0] | null> {
  try {
    const developerName = PLAN_NAME_TO_DEVELOPER_NAME[planName]
    if (!developerName) {
      console.error(`No mapping found for plan name: ${planName}`)
      return null
    }

    const sku = await getSkuByDeveloperName(developerName, product, base)
    return sku
  } catch (error) {
    console.error(`Failed to get SKU details for plan ${planName}:`, error)
    return null
  }
}

// Server action to get SKU details by Salesforce ID (reverse mapping)
export async function getSkuBySalesforceId(
  salesforceId: string,
  product: string = "saasstart",
  base: string = "base"
): Promise<ProductSkuResponse[0] | null> {
  try {
    const skus = await getProductSkus(product, base)
    return skus.find((sku) => sku.salesforceId === salesforceId) || null
  } catch (error) {
    console.error(
      `Failed to fetch SKU by Salesforce ID ${salesforceId}:`,
      error
    )
    return null
  }
}

// Server action to get organization entitlements
export async function getOrganizationEntitlements(
  sfOrgId: string
): Promise<EntitlementsResponse | null> {
  try {
    const endpoint = `/organization/${sfOrgId}/entitlements`
    const data = await callSalesforceAPI(endpoint)

    // Validate the response structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format: expected entitlements object")
    }

    return data as EntitlementsResponse
  } catch (error) {
    console.error(
      `Failed to fetch organization entitlements for org ${sfOrgId}:`,
      error
    )
    return null
  }
}

// Server action to update entitlement usage
export async function updateEntitlementUsage(
  sfOrgId: string,
  entitlementId: string,
  usedAmount: number
): Promise<UpdateUsageResponse> {
  try {
    const endpoint = `/organization/${sfOrgId}/entitlements`
    const data = await callSalesforceAPI(endpoint, {
      method: "POST",
      body: {
        entitlementId,
        usedAmount,
      },
    })

    // Validate the response structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format: expected usage update response")
    }

    const response = data as UpdateUsageResponse

    // Check if the update was successful
    if (response.status !== "success") {
      throw new Error(
        `Failed to update usage: ${response.message || "Unknown error"}`
      )
    }

    return response
  } catch (error) {
    console.error(
      `Failed to update entitlement usage for org ${sfOrgId}:`,
      error
    )
    throw error
  }
}

// WORKAROUND: Get actual email usage by posting 0 count to force refresh
// This is a temporary fix until the GET endpoint returns accurate usage
export async function getActualEmailUsage(
  sfOrgId: string
): Promise<{ usage: number; limit: number } | null> {
  try {
    // First, get entitlements to find the NumberofEmailsPerDay entitlement ID
    const entitlements = await getOrganizationEntitlements(sfOrgId)
    
    if (!entitlements) {
      console.error("Failed to fetch entitlements for email usage workaround")
      return null
    }

    // Find the NumberofEmailsPerDay entitlement
    let emailEntitlementId = ""
    let emailLimit = 0

    for (const productName in entitlements) {
      const categories = entitlements[productName]
      for (const categoryName in categories) {
        const entitlementList = categories[categoryName]
        const emailEntitlement = entitlementList.find(
          (e) => e.developerName === "NumberofEmailsPerDay"
        )
        if (emailEntitlement) {
          emailEntitlementId = emailEntitlement.id
          emailLimit = emailEntitlement.featureLimit || 0
          break
        }
      }
      if (emailEntitlementId) break
    }

    if (!emailEntitlementId) {
      console.error("NumberofEmailsPerDay entitlement not found")
      return null
    }

    // Post with 0 to get the current usage without changing it
    const response = await updateEntitlementUsage(sfOrgId, emailEntitlementId, 0)
    
    return {
      usage: response.usage || 0,
      limit: response.limit || emailLimit,
    }
  } catch (error) {
    console.error("Failed to get actual email usage:", error)
    return null
  }
}

