"use client"

import React from "react"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  type: "success" | "error" | "loading"
  title: string
  message: string
  onConfirm?: () => void
  confirmText?: string
  showCancel?: boolean
}

export function SubscriptionModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  onConfirm,
  confirmText = "OK",
  showCancel = false,
}: SubscriptionModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
      case "error":
        return <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
      case "loading":
        return (
          <div className="mx-auto mb-4 h-12 w-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500"></div>
          </div>
        )
      default:
        return (
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        )
    }
  }

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          button: "bg-green-600 hover:bg-green-700 text-white",
        }
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          button: "bg-red-600 hover:bg-red-700 text-white",
        }
      case "loading":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          button: "bg-blue-600 hover:bg-blue-700 text-white",
        }
      default:
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          button: "bg-yellow-600 hover:bg-yellow-700 text-white",
        }
    }
  }

  const colors = getColors()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className={`w-full max-w-md ${colors.bg} ${colors.border}`}>
        <CardHeader className="pb-4 text-center">
          {getIcon()}
          <CardTitle className="text-xl font-semibold text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <CardDescription className="mb-6 text-base text-gray-700">
            {message}
          </CardDescription>

          <div className="flex justify-center gap-3">
            {showCancel && (
              <Button variant="outline" onClick={onClose} className="px-6">
                Cancel
              </Button>
            )}
            <Button
              onClick={onConfirm || onClose}
              className={`px-6 ${colors.button}`}
              disabled={type === "loading"}
            >
              {type === "loading" ? "Processing..." : confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
