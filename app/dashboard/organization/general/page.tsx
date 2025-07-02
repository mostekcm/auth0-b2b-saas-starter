import { appClient } from "@/lib/auth0"
import { managementClient } from "@/lib/managementClient"
import { PageHeader } from "@/components/page-header"

import { DisplayNameForm } from "./display-name-form"

export default async function GeneralSettings() {
  const session = await appClient.getSession()

  if (!session?.user?.org_id) {
    return {
      error: "Must have an org_id in the user object in the session.",
    }
  }

  const { data: org } = await managementClient.organizations.get({
    id: session!.user.org_id,
  })

  return (
    <div className="space-y-2">
      <PageHeader
        title="General Settings"
        description="Update your organization's general settings."
      />

      <DisplayNameForm
        organization={{
          id: org.id,
          slug: org.name,
          displayName: org.display_name,
        }}
      />
    </div>
  )
}
