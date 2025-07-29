import React from 'react'
import { Check, AlertTriangle, X, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface VerificationPillProps {
  status: 'verified' | 'highly_likely' | 'unverified'
  reasoning?: string
  className?: string
}

export function VerificationPill({ status, reasoning, className = '' }: VerificationPillProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          label: 'Verified',
          icon: <Check className="h-3 w-3" />,
          variant: 'default' as const,
          color: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-600'
        }
      case 'highly_likely':
        return {
          label: 'Highly Likely',
          icon: <Shield className="h-3 w-3" />,
          variant: 'secondary' as const,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600'
        }
      case 'unverified':
      default:
        return {
          label: 'Unverified',
          icon: <AlertTriangle className="h-3 w-3" />,
          variant: 'outline' as const,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconColor: 'text-yellow-600'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={config.variant}
        className={`flex items-center gap-1.5 font-medium ${config.color}`}
      >
        <span className={config.iconColor}>
          {config.icon}
        </span>
        {config.label}
      </Badge>
      
      {reasoning && (
        <div className="text-xs text-muted-foreground max-w-xs">
          {reasoning}
        </div>
      )}
    </div>
  )
} 