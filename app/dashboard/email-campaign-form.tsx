"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle, Mail, Send, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SubscriptionModal } from "@/components/subscription-modal"
import { sendEmailCampaignAction } from "@/app/actions/email-campaign"

interface EmailCampaignFormProps {
  sfOrgId: string
  subscription: string
  emailLimit: number
  initialEmailsSent: number
}

interface CustomerGroup {
  id: string
  name: string
  size: number
  description: string
}

const customerGroups: CustomerGroup[] = [
  {
    id: "premium-customers",
    name: "Premium Customers",
    size: 127,
    description: "High-value customers with premium subscriptions",
  },
  {
    id: "trial-users",
    name: "Trial Users",
    size: 284,
    description: "Users currently on free trial",
  },
  {
    id: "enterprise-clients",
    name: "Enterprise Clients",
    size: 45,
    description: "Large enterprise customers",
  },
  {
    id: "new-signups",
    name: "New Signups",
    size: 156,
    description: "Users who signed up in the last 30 days",
  },
  {
    id: "inactive-users",
    name: "Inactive Users",
    size: 892,
    description: "Users who haven't logged in for 30+ days",
  },
  {
    id: "power-users",
    name: "Power Users",
    size: 89,
    description: "Highly engaged users with frequent activity",
  },
]

export function EmailCampaignForm({
  sfOrgId,
  subscription,
  emailLimit,
  initialEmailsSent,
}: EmailCampaignFormProps) {
  const router = useRouter()
  const [selectedGroup, setSelectedGroup] = useState("")
  const [subject, setSubject] = useState("Exciting Updates from Our Team!")
  const [emailBody, setEmailBody] = useState(`Hi there!

We hope this email finds you well. We're excited to share some fantastic updates and new features that we've been working on just for you.

🎉 New Feature Launch: We've just released our enhanced dashboard with improved analytics and reporting capabilities.

💡 Upcoming Webinar: Join us next week for an exclusive webinar where we'll dive deep into maximizing your ROI with our platform.

🎁 Special Offer: As a valued customer, you're eligible for a 20% discount on your next upgrade. Use code VALUED20 at checkout.

We truly appreciate your continued trust in our platform and look forward to supporting your success.

Best regards,
The Team`)

  const [emailsSent, setEmailsSent] = useState(initialEmailsSent)
  const [isSending, setIsSending] = useState(false)
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: "success" | "error"
    title: string
    message: string
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  })

  const selectedGroupData = customerGroups.find((g) => g.id === selectedGroup)
  const remainingEmails = emailLimit - emailsSent
  const canSendToGroup = selectedGroupData
    ? selectedGroupData.size <= remainingEmails
    : false
  const isOverSubscribed = emailsSent > emailLimit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedGroup || !selectedGroupData) {
      setModal({
        isOpen: true,
        type: "error",
        title: "No Group Selected",
        message: "Please select a customer group to send the campaign to.",
      })
      return
    }

    if (!canSendToGroup) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Email Limit Exceeded",
        message: `You don't have enough emails remaining this month. You have ${remainingEmails} emails left, but need ${selectedGroupData.size} to send to this group. Consider upgrading your subscription for more emails.`,
      })
      return
    }

    setIsSending(true)

    try {
      // Call the server action to send the campaign and update usage
      const result = await sendEmailCampaignAction({
        sfOrgId,
        groupSize: selectedGroupData.size,
        subject,
        emailBody,
        groupName: selectedGroupData.name,
      })

      if (result.success) {
        // Update local state with new usage
        setEmailsSent(result.usage || 0)

        setModal({
          isOpen: true,
          type: "success",
          title: "Campaign Sent Successfully!",
          message: result.message,
        })

        // Reset form
        setSelectedGroup("")

        // Refresh the server component to get fresh entitlements data
        router.refresh()
      } else {
        setModal({
          isOpen: true,
          type: "error",
          title: "Campaign Failed",
          message: result.message,
        })
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Campaign Failed",
        message: `Failed to send campaign: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleModalClose = () => {
    setModal({ ...modal, isOpen: false })
  }

  const getSubscriptionDisplayName = (sub: string) => {
    switch (sub) {
      case "free_trial":
        return "Free Trial"
      case "starter":
        return "Starter"
      case "pro":
        return "Pro"
      default:
        return "No Subscription"
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Usage Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail
              className={`h-4 w-4 ${isOverSubscribed ? "text-red-500" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${isOverSubscribed ? "text-red-600" : ""}`}
            >
              {emailsSent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Send
              className={`h-4 w-4 ${remainingEmails < 0 ? "text-red-500" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${remainingEmails < 0 ? "text-red-600" : ""}`}
            >
              {remainingEmails.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              of {emailLimit.toLocaleString()} limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getSubscriptionDisplayName(subscription)}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link
                href="/dashboard/organization/subscription"
                className="text-blue-600 hover:underline"
              >
                Manage subscription
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warning for low email count - Prominent placement */}
      {remainingEmails < 100 && remainingEmails > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              <strong>Low email count:</strong> You only have {remainingEmails}{" "}
              emails remaining this month. Consider{" "}
              <Link
                href="/dashboard/organization/subscription"
                className="underline"
              >
                upgrading your subscription
              </Link>{" "}
              for more emails.
            </p>
          </div>
        </div>
      )}

      {/* Email Campaign Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Email Campaign</CardTitle>
          <CardDescription>
            Send targeted email campaigns to your customer groups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Group Selection */}
            <div className="space-y-2">
              <Label htmlFor="customerGroup">Customer Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer group" />
                </SelectTrigger>
                <SelectContent>
                  {customerGroups.map((group) => {
                    const canSend = group.size <= remainingEmails
                    return (
                      <SelectItem
                        key={group.id}
                        value={group.id}
                        disabled={!canSend}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-medium">{group.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {group.description}
                            </span>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <Badge
                              variant={canSend ? "default" : "destructive"}
                            >
                              {group.size} users
                            </Badge>
                            {!canSend && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {selectedGroupData && (
                <p className="text-sm text-muted-foreground">
                  {canSendToGroup ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      You can send to this group ({selectedGroupData.size}{" "}
                      emails)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      Not enough emails remaining ({selectedGroupData.size}{" "}
                      needed, {remainingEmails} available)
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Email Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                required
              />
            </div>

            {/* Email Body */}
            <div className="space-y-2">
              <Label htmlFor="emailBody">Email Content</Label>
              <Textarea
                id="emailBody"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Enter your email content"
                rows={12}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 border-t pt-4">
              <Button
                type="submit"
                disabled={isSending || !selectedGroup || !canSendToGroup}
                className="flex-1"
              >
                {isSending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending Campaign...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Campaign
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal for success/error messages */}
      <SubscriptionModal
        isOpen={modal.isOpen}
        onClose={handleModalClose}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={
          modal.type === "error" && modal.title === "Email Limit Exceeded"
            ? "Upgrade Subscription"
            : "OK"
        }
        onConfirm={() => {
          handleModalClose()
          if (
            modal.type === "error" &&
            modal.title === "Email Limit Exceeded"
          ) {
            window.location.href = "/dashboard/organization/subscription"
          }
        }}
      />
    </div>
  )
}
