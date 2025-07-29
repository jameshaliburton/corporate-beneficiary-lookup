import React from 'react'
import { Check, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { isTrustedSource, getTrustLevel } from '@/lib/agents/trustedSources'

interface Source {
  url: string
  name?: string
  confidence?: number
}

interface SourcesDisplayProps {
  sources: string[] | Source[]
  trustedSources?: string[]
  verifiedSources?: string[]
  highlyLikelySources?: string[]
  className?: string
}

export function SourcesDisplay({ 
  sources, 
  trustedSources = [], 
  verifiedSources = [],
  highlyLikelySources = [],
  className = '' 
}: SourcesDisplayProps) {
  if (!sources || sources.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        No sources available
      </div>
    )
  }

  const getSourceDomain = (source: string | Source): string => {
    const url = typeof source === 'string' ? source : source.url
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  const getSourceName = (source: string | Source): string => {
    if (typeof source === 'string') {
      return getSourceDomain(source)
    }
    return source.name || getSourceDomain(source)
  }

  const getSourceUrl = (source: string | Source): string => {
    return typeof source === 'string' ? source : source.url
  }

  const isTrusted = (source: string | Source): boolean => {
    const domain = getSourceDomain(source)
    return trustedSources.includes(domain) || isTrustedSource(domain)
  }

  const isVerified = (source: string | Source): boolean => {
    const domain = getSourceDomain(source)
    return verifiedSources.includes(domain) || getTrustLevel(domain) === 'verified'
  }

  const isHighlyLikely = (source: string | Source): boolean => {
    const domain = getSourceDomain(source)
    return highlyLikelySources.includes(domain) || getTrustLevel(domain) === 'highly_likely'
  }

  const getSourceBadge = (source: string | Source) => {
    if (isVerified(source)) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
          <Check className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )
    }
    if (isHighlyLikely(source)) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
          <Check className="h-3 w-3 mr-1" />
          Trusted
        </Badge>
      )
    }
    if (isTrusted(source)) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
          Reliable
        </Badge>
      )
    }
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-foreground">Sources</h4>
      <div className="space-y-2">
        {sources.map((source, index) => {
          const sourceName = getSourceName(source)
          const sourceUrl = getSourceUrl(source)
          const badge = getSourceBadge(source)
          
          return (
            <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {badge}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {sourceName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {sourceUrl}
                  </div>
                </div>
              </div>
              <a 
                href={sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
} 