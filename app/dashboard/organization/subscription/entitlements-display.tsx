import {
  getActualEmailUsage,
  getOrganizationEntitlements,
} from "@/lib/salesforce-api"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface EntitlementsDisplayProps {
  orgId: string
  memberCount: number
}

export async function EntitlementsDisplay({
  orgId,
  memberCount,
}: EntitlementsDisplayProps) {
  const entitlements = await getOrganizationEntitlements(orgId)

  if (!entitlements) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Entitlements</CardTitle>
          <CardDescription>
            Unable to load feature entitlements at this time
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // WORKAROUND: Get actual email usage by posting 0 to force refresh
  const emailUsageData = await getActualEmailUsage(orgId)

  const formatResetType = (resetType: string) => {
    switch (resetType.toLowerCase()) {
      case "never":
        return "No Reset"
      case "monthly":
        return "Monthly Reset"
      case "yearly":
        return "Yearly Reset"
      default:
        return resetType
    }
  }

  const getUsageColor = (usage: number, limit: number) => {
    const percentage = (usage / limit) * 100
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-orange-600"
    return "text-green-600"
  }

  const getProgressColor = (usage: number, limit: number) => {
    const percentage = (usage / limit) * 100
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-orange-500"
    return "bg-green-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Entitlements</CardTitle>
        <CardDescription>
          Current usage and limits for your subscription features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(entitlements).map(([productName, categories]) => (
          <div key={productName} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {productName}
            </h3>

            {Object.entries(categories).map(
              ([categoryName, entitlementList]) => (
                <div key={categoryName} className="space-y-3">
                  <h4 className="text-md font-medium text-gray-700">
                    {categoryName}
                  </h4>

                  <div className="grid gap-3">
                    {entitlementList.map((entitlement) => {
                      // Override usage for NumberofAdminUsers with actual member count
                      // Override usage for NumberofEmailsPerDay with actual usage from workaround
                      let actualUsage = entitlement.usage

                      if (entitlement.developerName === "NumberofAdminUsers") {
                        actualUsage = memberCount
                      } else if (
                        entitlement.developerName === "NumberofEmailsPerDay" &&
                        emailUsageData
                      ) {
                        actualUsage = emailUsageData.usage
                      }

                      // Handle on/off entitlements without featureLimit
                      const hasLimit = entitlement.featureLimit !== undefined
                      const isEnabled = hasLimit ? actualUsage > 0 : true

                      if (!hasLimit) {
                        // On/off entitlement display
                        return (
                          <div
                            key={entitlement.id}
                            className="rounded-lg border border-gray-200 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {entitlement.name}
                                </h5>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={isEnabled ? "default" : "secondary"}
                                  className={
                                    isEnabled
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {isEnabled ? "Enabled" : "Disabled"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      // Limited entitlement display
                      const usagePercentage = entitlement.featureLimit
                        ? (actualUsage / entitlement.featureLimit) * 100
                        : 0

                      return (
                        <div
                          key={entitlement.id}
                          className="rounded-lg border border-gray-200 p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">
                                {entitlement.name}
                              </h5>
                              <div className="mt-1 flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${
                                    entitlement.featureLimit
                                      ? getUsageColor(
                                          actualUsage,
                                          entitlement.featureLimit
                                        )
                                      : "text-gray-600"
                                  }`}
                                >
                                  {actualUsage} /{" "}
                                  {entitlement.featureLimit || 0}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {formatResetType(entitlement.resetType)}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {Math.round(usagePercentage)}%
                              </div>
                              <div className="text-xs text-gray-500">used</div>
                            </div>
                          </div>

                          <Progress
                            value={usagePercentage}
                            className="h-2"
                            style={
                              {
                                "--progress-background":
                                  entitlement.featureLimit
                                    ? getProgressColor(
                                        actualUsage,
                                        entitlement.featureLimit
                                      )
                                    : "#e5e7eb",
                              } as React.CSSProperties
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
