"use client"

import React, { useEffect, useState } from "react"

import { getProductSkus } from "@/lib/salesforce-api"
import { ProductSku } from "@/lib/salesforce-types"
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

export function ChangeSubscriptionForm({
  currentSubscription,
  orgId,
}: ChangeSubscriptionFormProps) {
  const [selectedPlan, setSelectedPlan] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [plans, setPlans] = useState<ProductSku[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
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

  // Load plans from Salesforce
  useEffect(() => {
    async function loadPlans() {
      try {
        const skus = await getProductSkus()
        setPlans(skus)
      } catch (error) {
        console.error("Failed to load subscription plans:", error)
        // Fallback to static plans on error
        setPlans([
          {
            skuPricing: { USD: 0 },
            skuName: "Free Trial",
            skuMarkup: null,
            salesforceId: "fallback-free-trial",
            salesChannel: "PLG",
            grantLength: 360,
            developerName: "SaaSStartFreeTrial",
            description:
              "Free Trial for SaaSStart with the basics to get you going",
            annualValue: 0,
          },
          {
            skuPricing: { USD: 200 },
            skuName: "Starter",
            skuMarkup: null,
            salesforceId: "fallback-starter",
            salesChannel: "PLG",
            grantLength: 360,
            developerName: "SaaSStartStarter",
            description: "Starter Plan for SaaSStart",
            annualValue: 200,
          },
          {
            skuPricing: { USD: 1000 },
            skuName: "Professional",
            skuMarkup: null,
            salesforceId: "fallback-pro",
            salesChannel: "PLG",
            grantLength: 360,
            developerName: "SaaSStartPro",
            description: "Pro license for SaaSStart",
            annualValue: 1000,
          },
        ])
      } finally {
        setLoadingPlans(false)
      }
    }

    loadPlans()
  }, [])

  console.log("Current subscription:", currentSubscription)
  console.log("Selected plan:", selectedPlan)

  const getPlanId = (sku: ProductSku) => {
    // Convert SKU name to plan ID format for comparison
    if (sku.skuName === "Free Trial") return "free_trial"
    if (sku.skuName === "Starter") return "starter"
    if (sku.skuName === "Professional" || sku.skuName === "Pro") return "pro"
    return sku.skuName.toLowerCase().replace(/\s+/g, "_")
  }

  const isPopularPlan = (sku: ProductSku) => {
    // Mark starter plan as popular
    return sku.skuName === "Starter"
  }

  const formatSkuPricing = (sku: ProductSku): string => {
    if (sku.skuPricing.USD === 0) {
      return "FREE"
    }

    // Format annual value as monthly if needed
    const monthlyPrice = Math.round(sku.annualValue / 12)
    return sku.annualValue > 0 ? `$${monthlyPrice}` : `$${sku.skuPricing.USD}`
  }

  const getSkuPricingNote = (sku: ProductSku): string => {
    if (sku.skuPricing.USD === 0) {
      return "14-day trial"
    }
    return "/month"
  }

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
    const selectedPlanObj = plans.find((p) => getPlanId(p) === selectedPlan)
    const planName = selectedPlanObj?.skuName || selectedPlan

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
        {loadingPlans ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="ml-2">Loading subscription plans...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <RadioGroup value={selectedPlan} onValueChange={handlePlanSelect}>
              <div className="grid gap-4">
                {plans.map((plan) => {
                  const planId = getPlanId(plan)
                  const isCurrentPlan = currentSubscription === planId
                  const isSelected = selectedPlan === planId
                  const isPopular = isPopularPlan(plan)

                  return (
                    <div key={plan.salesforceId} className="relative">
                      <RadioGroupItem
                        value={planId}
                        id={planId}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={planId}
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
                                {plan.skuName}
                              </span>
                              {isPopular && (
                                <Badge className="bg-blue-500 text-xs text-white">
                                  Most Popular
                                </Badge>
                              )}
                              {isCurrentPlan && (
                                <Badge className="bg-green-600 text-xs font-semibold text-white">
                                  ✓ Current Plan
                                </Badge>
                              )}
                            </div>
                            <div className="mb-2 text-sm text-gray-600">
                              {plan.description}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                                {plan.grantLength} days grant
                              </span>
                              <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                                {plan.salesChannel} channel
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {formatSkuPricing(plan)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getSkuPricingNote(plan)}
                          </div>
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
        )}
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
