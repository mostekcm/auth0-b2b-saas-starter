import { getProductSkus } from "@/lib/salesforce-api"
import { DynamicSubscriptionPlans } from "@/components/dynamic-subscription-plans"

export default async function DynamicSubscriptionPage() {
  // Fetch SKUs from Salesforce API on the server
  const skus = await getProductSkus("saasstart", "base")

  return (
    <div>
      <DynamicSubscriptionPlans initialSkus={skus} />
    </div>
  )
}
