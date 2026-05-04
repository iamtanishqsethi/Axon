"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {Spinner} from "@/components/kibo-ui/spinner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast glass-surface group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-3xl px-4 py-3",
          description: "group-[.toast]:text-muted-foreground font-medium text-xs",
          title: "font-bold text-sm",
          actionButton:
            "bg-foreground text-background font-bold rounded-full px-4 py-2 text-xs transition-all hover:opacity-90 active:scale-95 shadow-md",
          cancelButton:
            "bg-muted/50 text-muted-foreground font-bold rounded-full px-4 py-2 text-xs transition-all hover:bg-muted active:scale-95 border border-border/40",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-5 text-emerald-500" />,
        info: <InfoIcon className="size-5 text-blue-500" />,
        warning: <TriangleAlertIcon className="size-5 text-yellow-500" />,
        error: <OctagonXIcon className="size-5 text-destructive" />,
        loading: <Spinner variant={'bars'} size={16} />,
      }}
      style={
        {
          "--normal-bg": "transparent",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
