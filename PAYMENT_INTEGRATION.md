# Payment Integration Guide

This document explains the payment flow implementation for the subscription system.

## Components

### 1. PaymentScreen Component

**Location**: `components/payment-screen.tsx`

**Features**:

- Collects billing and payment information
- Pre-fills user data from Auth0 session
- Responsive design with order summary
- Handles both free trials and paid subscriptions
- Fake credit card data pre-filled for POC

**Pre-filled Data**:

- **Contact Info**: Uses Auth0 user profile (name, email)
- **Company**: Uses organization name if available
- **Billing Address**: Fake data for demo (123 Business Ave, San Francisco, CA)
- **Payment Info**: Fake Stripe test card (4242424242424242, 12/25, 123)

### 2. Subscription Action

**Location**: `app/actions/subscription.ts`

**Function**: `submitSubscriptionAction(subscriptionData)`

**Current Implementation**:

- Placeholder server action that logs submission data
- Returns mock success/failure responses
- Ready for integration with payment processors

## Integration Flow

```
1. User selects plan → SubscriptionSelectionScreen
2. Clicks "Choose Plan" → PaymentScreen
3. Reviews pre-filled data → Can edit if needed
4. Clicks "Subscribe" → submitSubscriptionAction
5. Action processes payment → Updates Auth0 claims
6. Redirects to dashboard → User has access
```

## Next Steps for Production

### 1. Payment Processing

Replace the placeholder action with real payment processing:

```typescript
// Install Stripe
npm install stripe

// In subscription.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function processPayment(paymentData, amount) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'usd',
    payment_method_data: {
      type: 'card',
      card: {
        number: paymentData.cardNumber,
        exp_month: parseInt(paymentData.expiryDate.split('/')[0]),
        exp_year: parseInt('20' + paymentData.expiryDate.split('/')[1]),
        cvc: paymentData.cvv,
      },
    },
    confirm: true,
  });

  return paymentIntent;
}
```

### 2. Auth0 User Metadata Update

Update user's subscription in Auth0:

```typescript
import { ManagementClient } from "auth0"

const managementClient = new ManagementClient({
  domain: process.env.AUTH0_MANAGEMENT_API_DOMAIN!,
  clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID!,
  clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET!,
})

export async function updateUserSubscription(
  userId: string,
  subscription: string
) {
  await managementClient.updateAppMetadata(userId, {
    subscription: subscription.toLowerCase().replace(" ", "_"),
    subscriptionDate: new Date().toISOString(),
  })
}
```

### 3. Database Integration

Store subscription records in your database:

```typescript
// Example with Prisma
export async function createSubscriptionRecord(subscriptionData) {
  return await prisma.subscription.create({
    data: {
      userId: subscriptionData.userId,
      plan: subscriptionData.plan,
      status: "active",
      startDate: new Date(),
      paymentData: subscriptionData.paymentData,
    },
  })
}
```

### 4. Environment Variables

Add these to your `.env.local`:

```bash
# Stripe (for payment processing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Database (if using)
DATABASE_URL=...
```

### 5. Auth0 Custom Claims Action

Create a post-login Action in Auth0 to add subscription claims:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://example.com"

  // Get user's subscription from metadata
  const subscription = event.user.app_metadata?.subscription || "none"

  // Add custom claim to tokens
  api.idToken.setCustomClaim(`${namespace}/subscription`, subscription)
  api.accessToken.setCustomClaim(`${namespace}/subscription`, subscription)
}
```

## Testing

### Test Cards (Stripe)

- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`

### Test Flow

1. Navigate to `/dashboard` without subscription
2. Should see subscription selection screen
3. Choose any plan
4. Review pre-filled payment data
5. Submit form
6. Check console logs for processing details
7. Should redirect to dashboard on success

## Security Considerations

- **PCI Compliance**: Use Stripe Elements or similar for production
- **Server-side Validation**: Validate all payment data server-side
- **Rate Limiting**: Implement rate limiting on payment endpoints
- **Error Handling**: Don't expose sensitive error details to clients
- **Webhooks**: Use payment processor webhooks for reliable updates
