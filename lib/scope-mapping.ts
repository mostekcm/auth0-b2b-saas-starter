import fs from "fs"
import path from "path"

/**
 * Generate scope mapping from OpenAPI spec
 */
export function generateScopeMapping() {
  const oasPath = path.join(process.cwd(), "myorg-oas.json")
  const openApiSpec = JSON.parse(fs.readFileSync(oasPath, "utf8"))

  const scopeMapping: Record<string, string[]> = {}

  // Parse paths and extract security requirements
  for (const [pathPattern, pathObj] of Object.entries(
    openApiSpec.paths as Record<string, any>
  )) {
    for (const [method, methodObj] of Object.entries(
      pathObj as Record<string, any>
    )) {
      if (typeof methodObj === "object" && methodObj.security) {
        const key = `${method.toUpperCase()} ${pathPattern}`
        const scopes: string[] = []

        // Extract scopes from security array
        for (const securityItem of methodObj.security) {
          for (const [securityType, scopeArray] of Object.entries(
            securityItem
          )) {
            if (Array.isArray(scopeArray)) {
              scopes.push(...scopeArray)
            }
          }
        }

        if (scopes.length > 0) {
          scopeMapping[key] = Array.from(new Set(scopes)) // Remove duplicates
        }
      }
    }
  }

  return scopeMapping
}

/**
 * Pre-generated scope mapping from the OpenAPI spec
 * This avoids having to parse the JSON file at runtime
 */
export const SCOPE_MAPPING: Record<string, string[]> = {
  "GET /config": ["read:my_org:config"],
  "GET /details": ["read:my_org:details"],
  "PATCH /details": ["update:organization_details"],
  "GET /domains": ["read:my_org:domains"],
  "POST /domains": ["create:my_org:domains"],
  "GET /domains/{domain_id}": ["read:my_org:domains"],
  "DELETE /domains/{domain_id}": ["delete:my_org:domains"],
  "POST /domains/{domain_id}/verify": ["update:my_org:domains"],
  "GET /domains/{domain_id}/identity-providers": [
    "read:my_org:identity_providers_domains",
  ],
  "GET /identity-providers": ["read:my_org:identity_providers"],
  "POST /identity-providers": ["create:my_org:identity_providers"],
  "GET /identity-providers/{idp_id}": ["read:my_org:identity_providers"],
  "PATCH /identity-providers/{idp_id}": ["update:my_org:identity_providers"],
  "DELETE /identity-providers/{idp_id}": ["delete:my_org:identity_providers"],
  "POST /identity-providers/{idp_id}/detach": [
    "update:my_org:identity_providers",
  ],
  "GET /identity-providers/{idp_id}/domains": [
    "read:my_org:identity_providers",
  ],
  "POST /identity-providers/{idp_id}/domains": [
    "update:my_org:identity_providers",
  ],
  "DELETE /identity-providers/{idp_id}/domains/{domain}": [
    "update:my_org:identity_providers",
  ],
  "GET /identity-providers/{idp_id}/provisioning": [
    "read:my_org:identity_providers",
  ],
  "PATCH /identity-providers/{idp_id}/provisioning": [
    "update:my_org:identity_providers",
  ],
  "DELETE /identity-providers/{idp_id}/provisioning": [
    "delete:my_org:identity_providers",
  ],
  "GET /identity-providers/{idp_id}/provisioning/scim-tokens": [
    "read:my_org:identity_providers",
  ],
  "POST /identity-providers/{idp_id}/provisioning/scim-tokens": [
    "create:my_org:identity_providers",
  ],
  "PATCH /identity-providers/{idp_id}/provisioning/scim-tokens/{scim_token_id}":
    ["update:my_org:identity_providers"],
  "DELETE /identity-providers/{idp_id}/provisioning/scim-tokens/{scim_token_id}":
    ["delete:my_org:identity_providers"],
  "GET /members": ["read:my_org:members"],
  "GET /members/{user_id}": ["read:my_org:members"],
  "DELETE /members/{user_id}": ["delete:my_org:members"],
  "GET /invitations": ["read:my_org:invitations"],
  "POST /invitations": ["create:my_org:invitations"],
  "GET /invitations/{invitation_id}": ["read:my_org:invitations"],
  "DELETE /invitations/{invitation_id}": ["delete:my_org:invitations"],
  "GET /members/{user_id}/roles": ["read:my_org:member_roles"],
  "POST /members/{user_id}/roles": ["update:my_org:member_roles"],
  "DELETE /members/{user_id}/roles/{role_id}": ["update:my_org:member_roles"],
}

/**
 * Get required scopes for a given HTTP method and path
 */
export function getRequiredScopes(method: string, path: string): string[] {
  // Normalize the path by replacing path parameters with placeholders
  const normalizedPath = path.replace(
    /\/[^\/]+(?=\/|$)/g,
    (match, offset, string) => {
      // Check if this looks like a path parameter (not starting with known static segments)
      const pathSegments = string
        .substring(0, offset)
        .split("/")
        .filter(Boolean)
      const currentSegment = match.substring(1)

      // If it's not a known static path segment, treat as parameter
      const staticSegments = [
        "config",
        "details",
        "domains",
        "identity-providers",
        "members",
        "invitations",
        "verify",
        "detach",
        "provisioning",
        "scim-tokens",
        "roles",
      ]

      if (!staticSegments.includes(currentSegment) && pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1]

        if (lastSegment === "domains") return "/{domain_id}"
        if (lastSegment === "identity-providers") return "/{idp_id}"
        if (lastSegment === "members") return "/{user_id}"
        if (lastSegment === "invitations") return "/{invitation_id}"
        if (lastSegment === "roles") return "/{role_id}"
        if (lastSegment === "scim-tokens") return "/{scim_token_id}"
        if (lastSegment === "domains" && currentSegment) return "/{domain}"
      }

      return match
    }
  )

  const key = `${method.toUpperCase()} ${normalizedPath}`
  return SCOPE_MAPPING[key] || []
}
