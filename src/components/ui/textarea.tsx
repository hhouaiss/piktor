import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "placeholder:text-muted-foreground flex field-sizing-content w-full border bg-white text-base transition-all duration-200 ease-out outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y",
  {
    variants: {
      variant: {
        default: 
          "border-sophisticated-gray-300 rounded-lg px-4 py-3 shadow-sm hover:border-ocean-blue-400 hover:shadow-md focus:border-ocean-blue-600 focus:ring-2 focus:ring-ocean-blue-600/20 focus:shadow-lg dark:bg-sophisticated-gray-900 dark:border-sophisticated-gray-600 dark:hover:border-ocean-blue-500 dark:focus:border-ocean-blue-500 dark:focus:ring-ocean-blue-500/20",
        filled:
          "border-sophisticated-gray-200 bg-sophisticated-gray-50 rounded-lg px-4 py-3 shadow-sm hover:bg-sophisticated-gray-100 hover:border-ocean-blue-400 focus:bg-white focus:border-ocean-blue-600 focus:ring-2 focus:ring-ocean-blue-600/20 focus:shadow-lg dark:bg-sophisticated-gray-800 dark:border-sophisticated-gray-700 dark:hover:bg-sophisticated-gray-700 dark:focus:bg-sophisticated-gray-900",
        outline:
          "border-2 border-sophisticated-gray-300 rounded-lg px-4 py-3 bg-transparent hover:border-ocean-blue-400 hover:shadow-sm focus:border-ocean-blue-600 focus:ring-2 focus:ring-ocean-blue-600/20 focus:shadow-md dark:border-sophisticated-gray-600 dark:hover:border-ocean-blue-500 dark:focus:border-ocean-blue-500",
      },
      size: {
        sm: "min-h-12 px-3 py-2 text-sm",
        default: "min-h-16 px-4 py-3",
        lg: "min-h-20 px-6 py-4 text-base",
      },
      state: {
        default: "",
        error: "border-red-500 focus:border-red-600 focus:ring-red-600/20 dark:border-red-400 dark:focus:border-red-500",
        success: "border-green-500 focus:border-green-600 focus:ring-green-600/20 dark:border-green-400 dark:focus:border-green-500",
        warning: "border-amber-500 focus:border-amber-600 focus:ring-amber-600/20 dark:border-amber-400 dark:focus:border-amber-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
)

interface TextareaProps 
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {
  variant?: "default" | "filled" | "outline"
  size?: "sm" | "default" | "lg"  
  state?: "default" | "error" | "success" | "warning"
}

function Textarea({ className, variant, size, state, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant, size, state }), className)}
      {...props}
    />
  )
}

export { Textarea }
