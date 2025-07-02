import { redirect } from "next/navigation"

import { appClient } from "@/lib/auth0"
import { OrgSession } from "@/lib/with-server-action-auth"
import { PageHeader } from "@/components/page-header"

import { DeleteAccountForm } from "./delete-account-form"
import { DisplayNameForm } from "./display-name-form"

export default appClient.withPageAuthRequired(
  async function Profile(session: OrgSession): Promise<JSX.Element> {
    return (
      <div className="space-y-2">
        <PageHeader
          title="Profile"
          description="Manage your personal information."
        />

        <DisplayNameForm displayName={session?.user.name} />

        <DeleteAccountForm />
      </div>
    )
  },
  { returnTo: "/dashboard/account/profile" }
)
