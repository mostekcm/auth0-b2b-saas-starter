export class MustAuthenticateToGetNewToken extends Error {
  constructor(message: string = "Must authenticate to get new token") {
    super(message)
    this.name = "MustAuthenticateToGetNewToken"
  }
}

export class InsufficientScopesError extends Error {
  public requiredScopes: string[]
  public availableScopes: string[]

  constructor(requiredScopes: string[], availableScopes: string[]) {
    const message = `Insufficient scopes. Required: ${requiredScopes.join(", ")}, Available: ${availableScopes.join(", ")}`
    super(message)
    this.name = "InsufficientScopesError"
    this.requiredScopes = requiredScopes
    this.availableScopes = availableScopes
  }
}
