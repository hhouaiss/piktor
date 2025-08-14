import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col gap-6 transition-all duration-200 ease-out",
  {
    variants: {
      variant: {
        default: "rounded-xl border border-sophisticated-gray-200 shadow-sm hover:shadow-md dark:border-sophisticated-gray-700",
        elevated: "rounded-xl shadow-lg hover:shadow-xl border border-sophisticated-gray-100 dark:border-sophisticated-gray-800",
        premium: "rounded-xl shadow-premium hover:shadow-xl border-2 border-ocean-blue-100 bg-gradient-to-br from-white to-sophisticated-gray-50 dark:border-ocean-blue-800 dark:from-sophisticated-gray-900 dark:to-sophisticated-gray-800",
        outlined: "rounded-xl border-2 border-sophisticated-gray-300 hover:border-ocean-blue-300 hover:shadow-sm dark:border-sophisticated-gray-600 dark:hover:border-ocean-blue-500",
        ghost: "rounded-xl hover:bg-sophisticated-gray-50 hover:shadow-sm dark:hover:bg-sophisticated-gray-800/50",
        gradient: "rounded-xl shadow-lg border border-transparent bg-gradient-to-br from-ocean-blue-50 to-warm-gold-50 hover:shadow-xl dark:from-sophisticated-gray-900 dark:to-sophisticated-gray-800 dark:border-sophisticated-gray-700",
      },
      padding: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {
  variant?: "default" | "elevated" | "premium" | "outlined" | "ghost" | "gradient"
  padding?: "default" | "sm" | "lg" | "xl"
}

function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 [.border-b]:border-sophisticated-gray-200 dark:[.border-b]:border-sophisticated-gray-700",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-tight font-semibold text-lg text-sophisticated-gray-900 dark:text-sophisticated-gray-50", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm leading-relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6 [.border-t]:border-sophisticated-gray-200 dark:[.border-t]:border-sophisticated-gray-700", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
