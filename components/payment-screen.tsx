"use client"

import React, { useState } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { ArrowLeft, CreditCard, Lock, Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitSubscriptionAction } from "@/app/actions/subscription"

import { SubscriptionModal } from "./subscription-modal"

interface PaymentScreenProps {
  selectedPlan: string
  onBack: () => void
}

interface SubscriptionPlan {
  name: string
  price: string
  priceNote?: string
  users: string
  emails: string
}

const planDetails: Record<string, SubscriptionPlan> = {
  "Free Trial": {
    name: "Free Trial",
    price: "FREE",
    priceNote: "14-day trial",
    users: "1 User",
    emails: "50",
  },
  Starter: {
    name: "Starter",
    price: "$30",
    priceNote: "/month",
    users: "5 Users",
    emails: "500",
  },
  Pro: {
    name: "Pro",
    price: "$100",
    priceNote: "/month",
    users: "20 Users",
    emails: "2000",
  },
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  selectedPlan,
  onBack,
}) => {
  const { user } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)
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

  const plan = planDetails[selectedPlan]
  const isFree = selectedPlan === "Free Trial"

  // Pre-filled fake payment data based on user info
  const [paymentData, setPaymentData] = useState({
    // Contact Information
    firstName: (user?.given_name as string) || "John",
    lastName: (user?.family_name as string) || "Doe",
    email: (user?.email as string) || "john.doe@example.com",
    company: ((user as any)?.org_name as string) || "Acme Corporation",

    // Billing Address
    address: "123 Business Ave",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    country: "United States",

    // Payment Information (fake data for demo)
    cardNumber: "4242424242424242",
    expiryDate: "12/25",
    cvv: "123",
    nameOnCard: `${(user?.given_name as string) || "John"} ${(user?.family_name as string) || "Doe"}`,
  })

  const handleInputChange = (field: string, value: string) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitPayment = async () => {
    setIsProcessing(true)

    try {
      if (!user?.sub) {
        throw new Error("User not authenticated")
      }

      const orgId = (user as any)?.org_id
      if (!orgId) {
        throw new Error("Organization ID not found in user session")
      }

      // Call the server action
      const result = await submitSubscriptionAction({
        plan: selectedPlan,
        paymentData,
        userId: user.sub,
        orgId: orgId,
      })

      if (result.success) {
        setModal({
          isOpen: true,
          type: "success",
          title: "Subscription Successful!",
          message: `Successfully subscribed to ${selectedPlan}! You will be redirected to refresh your session.`,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Payment failed:", error)
      setModal({
        isOpen: true,
        type: "error",
        title: "Payment Failed",
        message: `Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleModalConfirm = () => {
    setModal({ ...modal, isOpen: false })
    if (modal.type === "success") {
      // Redirect after successful subscription - force fresh login to pick up updated subscription claims
      window.location.href = "/auth/login?returnTo=/dashboard"
    }
  }

  const handleModalClose = () => {
    setModal({ ...modal, isOpen: false })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plans
          </Button>

          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Complete Your Subscription
            </h1>
            <p className="text-gray-600">
              {isFree
                ? "Start your free trial - no payment required!"
                : "Secure payment processing with 256-bit SSL encryption"}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Order Summary */}
          <div className="lg:order-2">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Order Summary
              </h3>

              <div className="mb-4 rounded-lg bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-semibold text-blue-900">{plan.name}</h4>
                  {selectedPlan === "Starter" && (
                    <Badge className="bg-blue-500 text-white">
                      Most Popular
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-sm text-blue-800">
                  <div>👥 {plan.users}</div>
                  <div>📧 {plan.emails} emails/month</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total:</span>
                  <div className="text-right">
                    <span className="text-2xl">{plan.price}</span>
                    {plan.priceNote && (
                      <div className="text-sm font-normal text-gray-500">
                        {plan.priceNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!isFree && (
                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <Shield className="mr-2 h-4 w-4 text-green-500" />
                  Secure 256-bit SSL encryption
                </div>
              )}
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:order-1 lg:col-span-2">
            <Card className="p-6">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Contact Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={paymentData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={paymentData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={paymentData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={paymentData.company}
                        onChange={(e) =>
                          handleInputChange("company", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Billing Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        value={paymentData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={paymentData.city}
                          onChange={(e) =>
                            handleInputChange("city", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={paymentData.state}
                          onChange={(e) =>
                            handleInputChange("state", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={paymentData.zipCode}
                          onChange={(e) =>
                            handleInputChange("zipCode", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information - Only show for paid plans */}
                {!isFree && (
                  <div>
                    <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Payment Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          value={paymentData.cardNumber}
                          onChange={(e) =>
                            handleInputChange("cardNumber", e.target.value)
                          }
                          placeholder="1234 5678 9012 3456"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            value={paymentData.expiryDate}
                            onChange={(e) =>
                              handleInputChange("expiryDate", e.target.value)
                            }
                            placeholder="MM/YY"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            value={paymentData.cvv}
                            onChange={(e) =>
                              handleInputChange("cvv", e.target.value)
                            }
                            placeholder="123"
                            className="mt-1"
                          />
                        </div>
                        <div>{/* Empty div for grid spacing */}</div>
                      </div>
                      <div>
                        <Label htmlFor="nameOnCard">Name on Card</Label>
                        <Input
                          id="nameOnCard"
                          value={paymentData.nameOnCard}
                          onChange={(e) =>
                            handleInputChange("nameOnCard", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="border-t pt-6">
                  <Button
                    onClick={handleSubmitPayment}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        {isFree
                          ? "Start Free Trial"
                          : `Subscribe to ${selectedPlan}`}
                      </>
                    )}
                  </Button>

                  {!isFree && (
                    <p className="mt-2 text-center text-sm text-gray-500">
                      You will be charged {plan.price}
                      {plan.priceNote} starting today.
                    </p>
                  )}
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={modal.isOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.type === "success" ? "Continue" : "OK"}
      />
    </div>
  )
}
