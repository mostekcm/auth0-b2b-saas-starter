// Types for the Salesforce API response
export interface SkuPricing {
  USD: number
}

export interface ProductSku {
  skuPricing: SkuPricing
  skuName: string
  skuMarkup: string | null
  salesforceId: string
  salesChannel: string
  grantLength: number
  developerName: string
  description: string
  annualValue: number
}

export type ProductSkuResponse = ProductSku[]

// Types for the Entitlements API response
export interface Entitlement {
  usage: number
  resetType: string
  name: string
  id: string
  featureLimit?: number // Optional for on/off entitlements
  developerName: string
}

export interface EntitlementCategory {
  [categoryName: string]: Entitlement[]
}

export interface EntitlementsResponse {
  [productName: string]: EntitlementCategory
}

// Types for the Update Usage API response
export interface UpdateUsageResponse {
  limit: number
  featureFlagDeveloperName: string
  usage: number
  message: string
  status: string
}
