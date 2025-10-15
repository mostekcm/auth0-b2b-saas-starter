# Subscription Gate Components

This directory contains the subscription gating components for the Auth0 B2B SaaS starter application.

## Components

### 1. SubscriptionGate

A wrapper component that controls access to premium features based on user subscription status.

**Props:**

- `children`: React.ReactNode - The content to render when user has a valid subscription

**Usage:**

```typescript
import { SubscriptionGate } from '@/components/subscription-gate';

export default function PremiumFeature() {
  return (
    <SubscriptionGate>
      <div>This content requires a subscription</div>
    </SubscriptionGate>
  );
}
```

### 2. SubscriptionSelectionScreen

A full-screen component that displays subscription tiers and allows users to select a plan.

**Features:**

- Responsive card-based layout
- Three subscription tiers: Free Trial, Starter, Pro
- Integration ready for payment processors
- Uses existing UI components (Button, Card, Badge)

## How It Works

1. **Authentication Check**: Uses `@auth0/nextjs-auth0/client` to get the current user
2. **Custom Claims**: Looks for subscription data in Auth0 custom claims at `https://example.com/subscription`
3. **Subscription Validation**:
   - If subscription is `null`, `""`, or `"none"` → Shows SubscriptionSelectionScreen
   - Otherwise → Renders the protected content

## Setting Up Subscription Claims

To use these components, you need to set up custom claims in Auth0:

### 1. Create an Auth0 Action

Create a post-login Action that adds subscription claims:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://example.com"

  // Get user's subscription from your database or metadata
  const subscription = event.user.app_metadata?.subscription || "none"

  // Add custom claim
  api.idToken.setCustomClaim(`${namespace}/subscription`, subscription)
  api.accessToken.setCustomClaim(`${namespace}/subscription`, subscription)
}
```

### 2. Update User Metadata

When a user subscribes, update their Auth0 metadata:

```javascript
// Using Auth0 Management API
const updateUser = async (userId, subscription) => {
  await managementClient.updateAppMetadata(userId, {
    subscription: subscription, // 'free', 'starter', 'pro'
  })
}
```

## Environment Configuration

The components use the custom claims namespace from your environment:

```bash
CUSTOM_CLAIMS_NAMESPACE=https://example.com
```

## Integration with Payment Processors

To integrate with Stripe or other payment processors:

1. Update the `handleChoosePlan` function in `SubscriptionSelectionScreen`
2. Add payment flow logic
3. Update Auth0 user metadata after successful payment
4. Redirect user back to the protected content

## Testing

To test the subscription gate:

1. **No Subscription**: Ensure user has no subscription claim or `subscription: "none"`
2. **Valid Subscription**: Set user's subscription claim to any non-empty value except "none"

You can modify the user's metadata in the Auth0 Dashboard for testing purposes.

## Customization

### Adding New Subscription Tiers

Edit the `subscriptionTiers` array in `SubscriptionSelectionScreen`:

```typescript
const subscriptionTiers: SubscriptionTier[] = [
  {
    name: "Enterprise",
    users: "Unlimited",
    emails: "Unlimited",
    price: "$500",
    priceNote: "/month",
    features: ["Dedicated Support", "Custom Integrations", "SLA"],
  },
]
```

### Styling

The components use Tailwind CSS and existing UI components. Customize the styling by:

- Modifying Tailwind classes
- Updating the UI component variants
- Adding custom CSS classes
