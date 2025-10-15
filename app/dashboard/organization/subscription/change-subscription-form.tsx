"use client"

import React, { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SubscriptionModal } from "@/components/subscription-modal"
import { changeSubscriptionAction } from "@/app/actions/subscription"

interface ChangeSubscriptionFormProps {
  currentSubscription: string
  orgId: string
}

const subscriptionPlans = [
  {
    id: "free_trial",
    name: "Free Trial",
    price: "FREE",
    priceNote: "14-day trial",
    users: "1 User",
    emails: "50 emails/month",
    features: ["Basic Dashboard", "Email Support", "API Access"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$30",
    priceNote: "/month",
    users: "5 Users",
    emails: "500 emails/month",
    features: [
      "Advanced Analytics",
      "Priority Support",
      "Team Collaboration",
      "API Access",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$100",
    priceNote: "/month",
    users: "20 Users",
    emails: "2000 emails/month",
    features: [
      "Custom Integrations",
      "24/7 Support",
      "Advanced Security",
      "Unlimited API Access",
    ],
  },
]

export function ChangeSubscriptionForm({
  currentSubscription,
  orgId,
}: ChangeSubscriptionFormProps) {
  const [selectedPlan, setSelectedPlan] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: "success" | "error" | "loading"
    title: string
    message: string
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  })

  console.log("Current subscription:", currentSubscription)
  console.log("Selected plan:", selectedPlan)

  const handlePlanSelect = (planId: string) => {
    if (planId !== currentSubscription) {
      setSelectedPlan(planId)
      console.log("Plan selected:", planId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPlan) {
      setModal({
        isOpen: true,
        type: "error",
        title: "No Plan Selected",
        message: "Please select a plan to change your subscription.",
      })
      return
    }

    // Find the selected plan details
    const selectedPlanObj = subscriptionPlans.find((p) => p.id === selectedPlan)
    const planName = selectedPlanObj?.name || selectedPlan

    setIsLoading(true)

    try {
      const result = await changeSubscriptionAction(orgId, planName)

      if (result.success) {
        // Show success modal
        setModal({
          isOpen: true,
          type: "success",
          title: "Subscription Updated!",
          message: `Successfully changed subscription to ${planName}! You will be redirected to refresh your session.`,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Subscription Change Failed",
        message: `Failed to change subscription: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
      setIsLoading(false)
    }
  }

  const handleModalConfirm = () => {
    setModal({ ...modal, isOpen: false })
    if (modal.type === "success") {
      // Redirect after successful subscription change - using current auth setup
      window.location.href =
        "/auth/login?returnTo=/dashboard/organization/subscription"
    }
  }

  const handleModalClose = () => {
    setModal({ ...modal, isOpen: false })
    if (modal.type === "error") {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Subscription Plan</CardTitle>
        <CardDescription>
          Select a new plan for your organization. Changes take effect
          immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RadioGroup value={selectedPlan} onValueChange={handlePlanSelect}>
            <div className="grid gap-4">
              {subscriptionPlans.map((plan) => {
                const isCurrentPlan = currentSubscription === plan.id
                const isSelected = selectedPlan === plan.id
                return (
                  <div key={plan.id} className="relative">
                    <RadioGroupItem
                      value={plan.id}
                      id={plan.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={plan.id}
                      onClick={(e) => {
                        if (isCurrentPlan) {
                          e.preventDefault()
                          return
                        }
                      }}
                      className={`
                        relative flex items-center justify-between rounded-lg border-2 p-4 transition-all
                        ${
                          isCurrentPlan
                            ? "cursor-not-allowed border-green-400 bg-green-50 opacity-90"
                            : isSelected
                              ? "cursor-pointer border-blue-500 bg-blue-50"
                              : "cursor-pointer border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                        }
                      `}
                    >
                      {isCurrentPlan && (
                        <div className="absolute right-2 top-2 text-green-600">
                          <svg
                            className="h-6 w-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-lg font-semibold">
                              {plan.name}
                            </span>
                            {plan.popular && (
                              <Badge className="bg-blue-500 text-xs text-white">
                                Most Popular
                              </Badge>
                            )}
                            {currentSubscription === plan.id && (
                              <Badge className="bg-green-600 text-xs font-semibold text-white">
                                ✓ Current Plan
                              </Badge>
                            )}
                          </div>
                          <div className="mb-2 text-sm text-gray-600">
                            {plan.users} • {plan.emails}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {plan.features.slice(0, 2).map((feature, index) => (
                              <span
                                key={index}
                                className="rounded bg-gray-100 px-2 py-1 text-xs"
                              >
                                {feature}
                              </span>
                            ))}
                            {plan.features.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{plan.features.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{plan.price}</div>
                        {plan.priceNote && (
                          <div className="text-sm text-gray-500">
                            {plan.priceNote}
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                )
              })}
            </div>
          </RadioGroup>

          <div className="flex gap-3 border-t pt-4">
            <Button
              type="submit"
              disabled={isLoading || !selectedPlan}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                "Change Subscription"
              )}
            </Button>
          </div>

          {selectedPlan && selectedPlan !== currentSubscription && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your subscription will be changed
                immediately and you&apos;ll be redirected to refresh your
                session with the new plan details.
              </p>
            </div>
          )}
        </form>
      </CardContent>

      <SubscriptionModal
        isOpen={modal.isOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.type === "success" ? "Continue" : "OK"}
      />
    </Card>
  )
}
