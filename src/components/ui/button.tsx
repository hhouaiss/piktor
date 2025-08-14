import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:transform active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-ocean-deep text-white shadow-md hover:shadow-lg hover:bg-gradient-to-r hover:from-ocean-blue-700 hover:to-ocean-blue-600 border border-ocean-blue-700/20",
        primary:
          "bg-gradient-ocean-gold text-white shadow-md hover:shadow-lg hover:brightness-110 border border-warm-gold-600/20",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-lg hover:from-red-700 hover:to-red-600 focus-visible:ring-red-500/20 border border-red-600/20",
        outline:
          "border-2 border-sophisticated-gray-300 bg-background shadow-sm hover:bg-sophisticated-gray-50 hover:border-ocean-blue-300 hover:shadow-md dark:border-sophisticated-gray-700 dark:hover:bg-sophisticated-gray-800/50 dark:hover:border-ocean-blue-500",
        secondary:
          "bg-sophisticated-gray-100 text-sophisticated-gray-900 shadow-sm hover:bg-sophisticated-gray-200 hover:shadow-md border border-sophisticated-gray-200 dark:bg-sophisticated-gray-800 dark:text-sophisticated-gray-100 dark:border-sophisticated-gray-700 dark:hover:bg-sophisticated-gray-700",
        ghost:
          "hover:bg-sophisticated-gray-100 hover:text-sophisticated-gray-900 dark:hover:bg-sophisticated-gray-800/50 dark:hover:text-sophisticated-gray-100",
        link: "text-ocean-blue-600 underline-offset-4 hover:underline hover:text-ocean-blue-700 dark:text-ocean-blue-400 dark:hover:text-ocean-blue-300",
        premium:
          "bg-gradient-premium text-white shadow-premium hover:shadow-xl border border-sophisticated-gray-800/20",
        success:
          "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-lg hover:from-green-700 hover:to-green-600 border border-green-600/20",
        warning:
          "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md hover:shadow-lg hover:from-amber-700 hover:to-amber-600 border border-amber-600/20",
      },
      size: {
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs font-medium has-[>svg]:px-2.5 min-h-[44px] md:min-h-[32px]",
        default: "h-10 px-6 py-2 has-[>svg]:px-4 min-h-[44px] md:min-h-[40px]",
        lg: "h-12 rounded-lg px-8 text-base has-[>svg]:px-6 min-h-[44px] md:min-h-[48px]",
        xl: "h-14 rounded-lg px-10 text-lg font-bold has-[>svg]:px-8 min-h-[56px]",
        icon: "size-10 min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px]",
        "icon-sm": "size-8 min-h-[44px] min-w-[44px] md:min-h-[32px] md:min-w-[32px]",
        "icon-lg": "size-12 min-h-[44px] min-w-[44px] md:min-h-[48px] md:min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
