"use server"

import { appClient } from "./auth0"

export interface IdentityProvider {
  id: string
  name: string
  strategy: string
  assign_membership_on_login: boolean
}

export interface CreateSsoTicket {
  name: string
  assign_membership_on_login: boolean
  show_as_button: boolean
  display_name: string | null
}

export interface OrganizationConfig {
  show_as_button: ButtonDisplaySetting
  assign_membership_on_login: MembershipSetting
}

export type ButtonDisplaySetting = "required" | "optional" | "hidden"
export type MembershipSetting = "required" | "optional" | "hidden"

export type FeatureType = "scim" | "logout" // extendable

export interface EnabledStrategy {
  name: string
  enabled_features?: FeatureType[]
  connection_config?: ConnectionConfig
}

export interface ConnectionConfig {
  options: Record<string, any> // flexible shape for strategy-specific configs
}

export interface Config {
  organization: OrganizationConfig
}

function buildUrlWithQuery(url: string, query?: Record<string, any>) {
  if (!query) return url

  const searchParams = new URLSearchParams(query as Record<string, string>)
  return `${url}?${searchParams.toString()}`
}

async function call<BodyType, QueryType, ReturnType>(
  method: "GET" | "PATCH" | "POST" | "DELETE",
  url: string,
  options?: {
    query?: QueryType
    body?: BodyType
  }
): Promise<ReturnType> {
  const fullUrl = options?.query ? buildUrlWithQuery(url, options?.query) : url

  const accessToken = (await appClient.getAccessToken()).token

  const result = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`, // if needed
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!result.ok) {
    const errorBody = await result.text()
    throw new Error(`Failed: ${result.status} ${errorBody}`)
  }

  return await result.json()
}

async function get<QueryType, ReturnType>(
  url: string,
  options?: {
    query?: QueryType
  }
) {
  return call<unknown, QueryType, ReturnType>("GET", url, options)
}

async function patch<QueryType, BodyType, ReturnType>(
  url: string,
  options?: {
    query?: QueryType
    body?: BodyType
  }
) {
  return call<BodyType, QueryType, ReturnType>("PATCH", url, options)
}

async function post<QueryType, BodyType, ReturnType>(
  url: string,
  options?: {
    query?: QueryType
    body?: BodyType
  }
) {
  return call<BodyType, QueryType, ReturnType>("POST", url, options)
}

async function del<BodyType, ReturnType>(
  url: string,
  options?: {
    body?: BodyType
  }
) {
  return call<BodyType, unknown, ReturnType>("DELETE", url, options)
}

// async function getAccessToken() {
//   const session = await appClient.getSession()
//   if (!session || !session.accessToken) {
//     throw new Error("No access token available")
//   }

//   return session.accessToken
// }

async function getUrl(path: string) {
  const session = await appClient.getSession()
  if (!session || !session.user.org_id) {
    throw new Error("No user available")
  }
  return `${process.env.MY_ORG_API_BASE}/my-org${path}`
}

export const getConfig = async (): Promise<Config> => {
  return await get(await getUrl("/config"))
}

export const getAllIdentityProviders = async (): Promise<
  IdentityProvider[]
> => {
  const url = await getUrl("/identity-providers")
  const dataResult: {
    identity_providers: IdentityProvider[]
  } = await get(url)

  return dataResult.identity_providers
}

export const createIdentityProvider = async (body: CreateSsoTicket) => {
  const url = await getUrl("/identity-providers/tickets")
  const ticketResult: { ticket: string } = await post(url, {
    body,
  })
  return ticketResult.ticket
}

export interface Member {
  user_id: string
  roles: Array<{
    id: string
    name: string
  }>
  [key: string]: any // Custom user attributes from the UserAttributeProfile
}

export const getMembers = async () => {
  const url = await getUrl("/members")
  const memberResult: { members: Member[] } = await get(url)
  return memberResult.members
}

export interface Invitation {
  id: string
  organization_id: string
  inviter: {
    name: string
  }
  invitee: {
    email: string
    [key: string]: string | undefined
  }
  client_id: string
  connection_id: string
  created_at: string
  expires_at: string
  roles: string[]
  invitation_url: string
  ticket_id: string
}

export const removeMemberFromOrg = async (userId: string) => {
  const url = await getUrl(`/members/${userId}`)
  await del(url)
}

export interface CreateInvitation {
  invitee: {
    email: string
  }
  roles: string[]
}

export const getMemberInvitations = async () => {
  const url = await getUrl("/members/invitations")
  const result: { invitations: Invitation[] } = await get(url)
  return result.invitations
}

export const createMemberInvitation = async (options: CreateInvitation) => {
  const url = await getUrl("/members/invitations")
  const {
    invitation,
  }: {
    message: string
    invitation: Invitation
  } = await post(url, {
    body: {
      ...options,
      client_id: process.env.AUTH0_CLIENT_ID,
      send_invitation_email: true,
    },
  })

  return invitation
}

export const revokeMemberInvitation = async (invitationId: string) => {
  const url = await getUrl(`/members/invitations/${invitationId}`)
  await del(url)
}

export const getMemberRoles = async (userId: string): Promise<string[]> => {
  const url = await getUrl(`/members/${userId}/roles`)
  return await get(url)
}

export const assignMemberRoles = async (userId: string, roles: string[]) => {
  const url = await getUrl(`/members/${userId}/roles`)
  await post(url, {
    body: {
      roles,
    },
  })
}

export const revokeMemberRoles = async (userId: string, roles: string[]) => {
  const url = await getUrl(`/members/${userId}/roles`)
  await del(url, {
    body: {
      roles,
    },
  })
}
