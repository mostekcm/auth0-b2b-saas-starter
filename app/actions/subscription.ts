"use server"

import { managementClient } from "@/lib/auth0"
import { getSalesforceIdByPlanName } from "@/lib/salesforce-api"

export interface SubscriptionData {
  plan: string
  paymentData: {
    firstName: string
    lastName: string
    email: string
    company: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    cardNumber?: string
    expiryDate?: string
    cvv?: string
    nameOnCard?: string
  }
  userId: string
  orgId: string
}

export async function submitSubscriptionAction(
  subscriptionData: SubscriptionData
) {
  try {
    // TODO: Implement actual subscription logic
    console.log("Processing subscription:", subscriptionData)

    // TODO: For paid plans, process payment with Stripe/PayPal/etc
    if (subscriptionData.plan !== "Free Trial") {
      // await processPayment(subscriptionData.paymentData);
      console.log(
        "Payment would be processed here for plan:",
        subscriptionData.plan
      )
    }

    // Get Salesforce SKU ID for the selected plan
    const salesforceId = await getSalesforceIdByPlanName(subscriptionData.plan)
    console.log(`Salesforce ID for ${subscriptionData.plan}:`, salesforceId)

    // Get organization details for account name
    const { data: org } = await managementClient.organizations.get({
      id: subscriptionData.orgId,
    })

    // Update Auth0 organization metadata with subscription and Salesforce data
    await managementClient.organizations.update(
      { id: subscriptionData.orgId },
      {
        metadata: {
          subscription: subscriptionData.plan.toLowerCase().replace(" ", "_"),
          subscriptionDate: new Date().toISOString(),
          accountName: org.display_name || org.name,
          accountEmail: subscriptionData.paymentData.email,
          skus: salesforceId
            ? JSON.stringify([salesforceId])
            : JSON.stringify([]),
        },
      }
    )
    console.log(
      `Updated organization ${subscriptionData.orgId} with subscription: ${subscriptionData.plan}`
    )

    // TODO: Update your database with subscription details
    // await createSubscriptionRecord(subscriptionData);
    console.log("Subscription record would be created in database")

    // TODO: Send confirmation email
    // await sendSubscriptionConfirmationEmail(subscriptionData.paymentData.email);
    console.log("Confirmation email would be sent")

    // TODO: For free trials, set up trial expiration
    if (subscriptionData.plan === "Free Trial") {
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 14)
      console.log("Free trial would expire on:", trialEndDate)
    }

    return {
      success: true,
      message: `Successfully subscribed to ${subscriptionData.plan}`,
      subscriptionId: `sub_${Date.now()}`, // Mock subscription ID
    }
  } catch (error) {
    console.error("Subscription processing failed:", error)

    return {
      success: false,
      message: "Failed to process subscription. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Helper function to get organization subscription status
export async function getOrganizationSubscription(orgId: string) {
  try {
    const { data: org } = await managementClient.organizations.get({
      id: orgId,
    })
    const subscription = org.metadata?.subscription || "none"

    return {
      subscription,
      isActive: subscription !== "none" && subscription !== "",
      subscriptionDate: org.metadata?.subscriptionDate,
    }
  } catch (error) {
    console.error("Failed to get organization subscription:", error)
    return {
      subscription: "none",
      isActive: false,
      subscriptionDate: null,
    }
  }
}

// Helper function to update Auth0 user custom claims
export async function updateUserSubscriptionClaims(
  userId: string,
  subscription: string
) {
  // TODO: Implement Auth0 Management API call to update user metadata
  console.log(`Would update user ${userId} with subscription: ${subscription}`)

  // Example implementation:
  /*
  const managementClient = new ManagementClient({
    domain: process.env.AUTH0_MANAGEMENT_API_DOMAIN!,
    clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID!,
    clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET!,
  });

  await managementClient.updateAppMetadata(userId, {
    subscription: subscription.toLowerCase().replace(' ', '_'),
    subscriptionDate: new Date().toISOString(),
  });
  */
}

// Helper function to process payment (Stripe example)
export async function processPayment(
  paymentData: SubscriptionData["paymentData"],
  amount: number
) {
  // TODO: Implement payment processing
  console.log("Would process payment for amount:", amount)

  // Example Stripe implementation:
  /*
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'usd',
    payment_method_data: {
      type: 'card',
      card: {
        number: paymentData.cardNumber,
        exp_month: parseInt(paymentData.expiryDate!.split('/')[0]),
        exp_year: parseInt('20' + paymentData.expiryDate!.split('/')[1]),
        cvc: paymentData.cvv,
      },
    },
    confirmation_method: 'manual',
    confirm: true,
  });
  
  return paymentIntent;
  */
}

// Action to change/update subscription plan
export async function changeSubscriptionAction(orgId: string, newPlan: string) {
  try {
    // Get Salesforce SKU ID for the new plan
    const salesforceId = await getSalesforceIdByPlanName(newPlan)
    console.log(`Salesforce ID for ${newPlan}:`, salesforceId)

    // Get current organization data to preserve account name and email
    const { data: org } = await managementClient.organizations.get({
      id: orgId,
    })

    // Update Auth0 organization metadata with new subscription and preserved data
    await managementClient.organizations.update(
      { id: orgId },
      {
        metadata: {
          subscription: newPlan.toLowerCase().replace(" ", "_"),
          subscriptionDate: new Date().toISOString(),
          accountName:
            org.metadata?.accountName || org.display_name || org.name,
          accountEmail: org.metadata?.accountEmail || "",
          skus: salesforceId
            ? JSON.stringify([salesforceId])
            : JSON.stringify([]),
        },
      }
    )

    console.log(`Updated organization ${orgId} subscription to: ${newPlan}`)

    return {
      success: true,
      message: `Successfully changed subscription to ${newPlan}`,
    }
  } catch (error) {
    console.error("Failed to change subscription:", error)
    return {
      success: false,
      message: "Failed to update subscription. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
