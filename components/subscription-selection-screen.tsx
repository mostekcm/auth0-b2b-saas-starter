"use client"

import React, { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { PaymentScreen } from "./payment-screen"

interface SubscriptionTier {
  name: string
  users: string
  emails: string
  price: string
  priceNote?: string
  featured?: boolean
  features: string[]
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    name: "Free Trial",
    users: "1 User",
    emails: "50",
    price: "FREE",
    priceNote: "14-day trial",
    features: ["Basic Dashboard", "Email Support", "API Access"],
  },
  {
    name: "Starter",
    users: "5 Users",
    emails: "500",
    price: "$30",
    priceNote: "/month",
    featured: true,
    features: [
      "Advanced Analytics",
      "Priority Support",
      "Team Collaboration",
      "API Access",
    ],
  },
  {
    name: "Pro",
    users: "20 Users",
    emails: "2000",
    price: "$100",
    priceNote: "/month",
    features: [
      "Custom Integrations",
      "24/7 Support",
      "Advanced Security",
      "Unlimited API Access",
    ],
  },
]

export const SubscriptionSelectionScreen: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showPaymentScreen, setShowPaymentScreen] = useState(false)

  const handleChoosePlan = (tierName: string) => {
    setSelectedPlan(tierName)
    setShowPaymentScreen(true)
  }

  const handleBackToPlanSelection = () => {
    setShowPaymentScreen(false)
    setSelectedPlan(null)
  }

  // Show payment screen if a plan is selected
  if (showPaymentScreen && selectedPlan) {
    return (
      <PaymentScreen
        selectedPlan={selectedPlan}
        onBack={handleBackToPlanSelection}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Choose Your Plan
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Select the perfect plan for your team&apos;s needs. Upgrade or
            downgrade at any time.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {subscriptionTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`
                relative p-6 transition-all duration-200 hover:shadow-xl
                ${tier.featured ? "scale-105 shadow-xl ring-2 ring-blue-500" : "shadow-lg"}
              `}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                  <Badge className="bg-blue-500 px-4 py-1 text-white">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Name and Price */}
              <div className="mb-6 text-center">
                <h3 className="mb-4 text-2xl font-bold text-gray-900">
                  {tier.name}
                </h3>
                <div className="mb-2 flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">
                    {tier.price}
                  </span>
                  {tier.priceNote && (
                    <span className="ml-2 text-lg text-gray-500">
                      {tier.priceNote}
                    </span>
                  )}
                </div>
              </div>

              {/* Key Stats */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-gray-600">Users</span>
                  <span className="font-semibold text-gray-900">
                    {tier.users}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-gray-600">Emails/Month</span>
                  <span className="font-semibold text-gray-900">
                    {tier.emails}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8 space-y-3">
                <h4 className="mb-3 font-semibold text-gray-900">
                  Features included:
                </h4>
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <svg
                      className="mr-3 h-5 w-5 flex-shrink-0 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleChoosePlan(tier.name)}
                className={`
                  w-full py-3 font-semibold transition-all duration-200
                  ${
                    tier.featured
                      ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }
                `}
                size="lg"
              >
                Choose {tier.name}
              </Button>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="mx-auto max-w-2xl text-gray-500">
            All plans include SSL security, API access, and can be cancelled
            anytime. Need a custom solution?{" "}
            <span className="cursor-pointer text-blue-600 hover:underline">
              Contact our sales team
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
