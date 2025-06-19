import React from "react"
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, TrendingDown, Clock, Users, DollarSign, Activity } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'bet' | 'market_created' | 'market_resolved' | 'comment' | 'follow'
  user: {
    id: string
    name: string
    avatar?: string
    username: string
  }
  timestamp: Date
  market?: {
    id: string
    title: string
    category: string
  }
  amount?: number
  outcome?: 'yes' | 'no'
  description: string
}

interface ActivityFeedProps {
  limit?: number
  showHeader?: boolean
  className?: string
  userId?: string
  marketId?: string
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'bet',
    user: {
      id: '1',
      name: 'Alice Johnson',
      username: 'alice_j',
      avatar: '/avatars/alice.jpg'
    },
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    market: {
      id: '1',
      title: 'Will Bitcoin reach $100k by end of 2024?',
      category: 'Crypto'
    },
    amount: 250,
    outcome: 'yes',
    description: 'placed a $250 bet on YES'
  },
  {
    id: '2',
    type: 'market_created',
    user: {
      id: '2',
      name: 'Bob Smith',
      username: 'bob_smith',
      avatar: '/avatars/bob.jpg'
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    market: {
      id: '2',
      title: 'Will Tesla stock hit $300 this quarter?',
      category: 'Stocks'
    },
    description: 'created a new prediction market'
  },
  {
    id: '3',
    type: 'bet',
    user: {
      id: '3',
      name: 'Carol Davis',
      username: 'carol_d',
      avatar: '/avatars/carol.jpg'
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    market: {
      id: '3',
      title: 'Will it rain tomorrow in NYC?',
      category: 'Weather'
    },
    amount: 50,
    outcome: 'no',
    description: 'placed a $50 bet on NO'
  },
  {
    id: '4',
    type: 'market_resolved',
    user: {
      id: '4',
      name: 'David Wilson',
      username: 'david_w',
      avatar: '/avatars/david.jpg'
    },
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    market: {
      id: '4',
      title: 'Will the Fed raise rates in December?',
      category: 'Economics'
    },
    description: 'market resolved - YES outcome'
  },
  {
    id: '5',
    type: 'comment',
    user: {
      id: '5',
      name: 'Eva Brown',
      username: 'eva_b',
      avatar: '/avatars/eva.jpg'
    },
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    market: {
      id: '1',
      title: 'Will Bitcoin reach $100k by end of 2024?',
      category: 'Crypto'
    },
    description: 'commented on the market discussion'
  }
]

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'bet':
      return <DollarSign className="h-4 w-4" />
    case 'market_created':
      return <TrendingUp className="h-4 w-4" />
    case 'market_resolved':
      return <TrendingDown className="h-4 w-4" />
    case 'comment':
      return <Users className="h-4 w-4" />
    case 'follow':
      return <Users className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'bet':
      return 'text-[#06b6d4]'
    case 'market_created':
      return 'text-[#6366f1]'
    case 'market_resolved':
      return 'text-[#8b5cf6]'
    case 'comment':
      return 'text-gray-600'
    case 'follow':
      return 'text-green-600'
    default:
      return 'text-gray-500'
  }
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

const ActivityFeedSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-start space-x-3 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

export default function ActivityFeed({
  limit = 10,
  showHeader = true,
  className = '',
  userId,
  marketId
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        let filteredActivities = mockActivities
        
        if (userId) {
          filteredActivities = filteredActivities.filter(activity => activity.user.id === userId)
        }
        
        if (marketId) {
          filteredActivities = filteredActivities.filter(activity => activity.market?.id === marketId)
        }
        
        setActivities(filteredActivities.slice(0, limit))
      } catch (err) {
        setError('Failed to load activity feed')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [limit, userId, marketId])

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border border-gray-200 ${className}`} style={{ borderRadius: '0.75rem' }}>
      {showHeader && (
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Activity className="h-5 w-5 text-[#6366f1]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {loading ? (
          <ActivityFeedSkeleton />
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-full max-h-96">
            <div className="space-y-1">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors ${
                    index !== activities.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback className="bg-[#6366f1] text-white text-sm">
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {activity.user.name}
                      </span>
                      <span className="text-gray-500 text-xs">
                        @{activity.user.username}
                      </span>
                      <div className={`flex items-center gap-1 ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      {activity.description}
                    </p>
                    
                    {activity.market && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-gray-100 text-gray-700"
                        >
                          {activity.market.category}
                        </Badge>
                        <span className="text-xs text-gray-600 truncate">
                          {activity.market.title}
                        </span>
                      </div>
                    )}
                    
                    {activity.amount && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={activity.outcome === 'yes' ? 'default' : 'destructive'}
                          className={`text-xs ${
                            activity.outcome === 'yes' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {activity.outcome?.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-medium text-gray-900">
                          ${activity.amount}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
```