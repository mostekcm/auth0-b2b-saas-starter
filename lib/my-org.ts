import { Auth0MyOrgClient } from "auth0-myorg-ts-sdk"

import { appClient } from "./auth0"

export const getMyOrgClient = async () => {
  const session = await appClient.getSession()
  if (!session || !session.user.org_id) {
    throw new Error("No user available")
  }
  const accessToken = (await appClient.getAccessToken()).token

  return new Auth0MyOrgClient({ token: accessToken })
}
