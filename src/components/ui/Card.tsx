import type React from "react"
import { cn } from "../../lib/utils"

interface CardProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return <div className={cn("bg-white rounded-lg shadow border border-gray-200", className)}>{children}</div>
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return <div className={cn("px-6 py-4 border-b border-gray-200", className)}>{children}</div>
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return <div className={cn("px-6 py-4", className)}>{children}</div>
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
  return <h3 className={cn("text-lg font-medium text-gray-900", className)}>{children}</h3>
}

interface CardDescriptionProps {
  children: React.ReactNode
  className?: string
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className }) => {
  return <p className={cn("text-sm text-gray-600 mt-1", className)}>{children}</p>
}
