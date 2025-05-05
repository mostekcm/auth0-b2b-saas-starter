import { getAllIdentityProviders, getConfig } from "@/lib/org"
import { PageHeader } from "@/components/page-header"

import { ConnectionsList } from "./connections-list"

export default async function SSO() {
  const connections = await getAllIdentityProviders()
  const componentConfig = await getConfig()

  return (
    <div className="space-y-2">
      <PageHeader
        title="Single Sign-On"
        description="Configure SSO for your organization."
      />

      <ConnectionsList
        connections={connections
          // filter out the default connection ID assigned to all organizations
          .filter((c) => c.id !== process.env.DEFAULT_CONNECTION_ID)
          .map((c) => ({
            id: c.id,
            name: c.name,
            strategy: c.strategy,
            assignMembershipOnLogin: c.assign_membership_on_login,
          }))}
        componentConfig={componentConfig}
      />
    </div>
  )
}
