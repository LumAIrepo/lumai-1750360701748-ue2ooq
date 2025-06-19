import React from "react"
```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Clock, Users, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarketCardProps {
  id: string
  title: string
  description: string
  category: string
  endDate: Date
  totalVolume: number
  totalBettors: number
  yesPrice: number
  noPrice: number
  yesVolume: number
  noVolume: number
  isResolved?: boolean
  outcome?: 'yes' | 'no'
  createdBy: string
  imageUrl?: string
  className?: string
  onBet?: (marketId: string, side: 'yes' | 'no') => void
  onViewDetails?: (marketId: string) => void
}

export default function MarketCard({
  id,
  title,
  description,
  category,
  endDate,
  totalVolume,
  totalBettors,
  yesPrice,
  noPrice,
  yesVolume,
  noVolume,
  isResolved = false,
  outcome,
  createdBy,
  imageUrl,
  className,
  onBet,
  onViewDetails
}: MarketCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const formatPrice = (price: number) => `${(price * 100).toFixed(0)}¢`
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`
    return `$${volume.toFixed(0)}`
  }

  const getTimeRemaining = () => {
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    
    if (diff <= 0) return 'Ended'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const yesPercentage = totalVolume > 0 ? (yesVolume / totalVolume) * 100 : 50
  const noPercentage = 100 - yesPercentage

  const handleBetClick = (side: 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation()
    onBet?.(id, side)
  }

  const handleCardClick = () => {
    onViewDetails?.(id)
  }

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-300 hover:shadow-lg border-gray-200 bg-white',
        'hover:border-[#6366f1]/20 hover:-translate-y-1',
        isResolved && 'opacity-75',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className="bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20 text-xs font-medium"
              >
                {category}
              </Badge>
              {isResolved && outcome && (
                <Badge 
                  variant={outcome === 'yes' ? 'default' : 'destructive'}
                  className={cn(
                    'text-xs font-medium',
                    outcome === 'yes' 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  )}
                >
                  {outcome === 'yes' ? 'YES' : 'NO'}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
              {title}
            </CardTitle>
          </div>
          {imageUrl && (
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
              <img 
                src={imageUrl} 
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mt-2">
          {description}
        </p>
      </CardHeader>

      <CardContent className="py-4">
        <div className="space-y-4">
          {/* Price Display */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">YES</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-xl font-bold text-green-900 mt-1">
                {formatPrice(yesPrice)}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {yesPercentage.toFixed(0)}% chance
              </div>
            </div>
            
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-800">NO</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-xl font-bold text-red-900 mt-1">
                {formatPrice(noPrice)}
              </div>
              <div className="text-xs text-red-600 mt-1">
                {noPercentage.toFixed(0)}% chance
              </div>
            </div>
          </div>

          {/* Volume Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Volume Distribution</span>
              <span>{formatVolume(totalVolume)} total</span>
            </div>
            <Progress 
              value={yesPercentage} 
              className="h-2 bg-red-100"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${yesPercentage}%, #ef4444 ${yesPercentage}%, #ef4444 100%)`
              }}
            />
          </div>

          {/* Market Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{totalBettors} bettors</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{getTimeRemaining()}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{formatVolume(totalVolume)}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {!isResolved ? (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300',
                'transition-all duration-200',
                isHovered && 'shadow-sm'
              )}
              onClick={(e) => handleBetClick('yes', e)}
            >
              Bet YES
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300',
                'transition-all duration-200',
                isHovered && 'shadow-sm'
              )}
              onClick={(e) => handleBetClick('no', e)}
            >
              Bet NO
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
            onClick={handleCardClick}
          >
            View Results
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
```