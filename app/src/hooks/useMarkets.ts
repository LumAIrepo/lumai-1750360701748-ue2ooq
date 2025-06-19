import React from "react"
```typescript
import { useState, useEffect } from 'react'

export interface Market {
  id: string
  title: string
  description: string
  category: string
  endDate: Date
  totalVolume: number
  yesPrice: number
  noPrice: number
  yesShares: number
  noShares: number
  resolved: boolean
  outcome?: boolean
  createdAt: Date
  creator: string
}

export interface MarketFilters {
  category?: string
  resolved?: boolean
  search?: string
  sortBy?: 'volume' | 'endDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface UseMarketsReturn {
  markets: Market[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createMarket: (market: Omit<Market, 'id' | 'createdAt' | 'totalVolume' | 'yesShares' | 'noShares' | 'resolved'>) => Promise<void>
  resolveMarket: (marketId: string, outcome: boolean) => Promise<void>
}

export function useMarkets(filters?: MarketFilters): UseMarketsReturn {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMarkets = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for development
      const mockMarkets: Market[] = [
        {
          id: '1',
          title: 'Will Bitcoin reach $100k by end of 2024?',
          description: 'Prediction market for Bitcoin price reaching $100,000 USD by December 31, 2024',
          category: 'Crypto',
          endDate: new Date('2024-12-31'),
          totalVolume: 50000,
          yesPrice: 0.65,
          noPrice: 0.35,
          yesShares: 32500,
          noShares: 17500,
          resolved: false,
          createdAt: new Date('2024-01-01'),
          creator: 'user123'
        },
        {
          id: '2',
          title: 'Will AI achieve AGI in 2025?',
          description: 'Market predicting if Artificial General Intelligence will be achieved in 2025',
          category: 'Technology',
          endDate: new Date('2025-12-31'),
          totalVolume: 25000,
          yesPrice: 0.25,
          noPrice: 0.75,
          yesShares: 6250,
          noShares: 18750,
          resolved: false,
          createdAt: new Date('2024-02-15'),
          creator: 'user456'
        }
      ]

      let filteredMarkets = [...mockMarkets]

      if (filters?.category) {
        filteredMarkets = filteredMarkets.filter(market => 
          market.category.toLowerCase() === filters.category?.toLowerCase()
        )
      }

      if (filters?.resolved !== undefined) {
        filteredMarkets = filteredMarkets.filter(market => 
          market.resolved === filters.resolved
        )
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredMarkets = filteredMarkets.filter(market =>
          market.title.toLowerCase().includes(searchTerm) ||
          market.description.toLowerCase().includes(searchTerm)
        )
      }

      if (filters?.sortBy) {
        filteredMarkets.sort((a, b) => {
          let aValue: number | Date
          let bValue: number | Date

          switch (filters.sortBy) {
            case 'volume':
              aValue = a.totalVolume
              bValue = b.totalVolume
              break
            case 'endDate':
              aValue = a.endDate
              bValue = b.endDate
              break
            case 'createdAt':
              aValue = a.createdAt
              bValue = b.createdAt
              break
            default:
              aValue = a.createdAt
              bValue = b.createdAt
          }

          if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1
          if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1
          return 0
        })
      }

      setMarkets(filteredMarkets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch markets')
    } finally {
      setLoading(false)
    }
  }

  const createMarket = async (marketData: Omit<Market, 'id' | 'createdAt' | 'totalVolume' | 'yesShares' | 'noShares' | 'resolved'>): Promise<void> => {
    try {
      setError(null)
      
      const newMarket: Market = {
        ...marketData,
        id: Date.now().toString(),
        createdAt: new Date(),
        totalVolume: 0,
        yesShares: 0,
        noShares: 0,
        resolved: false
      }

      setMarkets(prev => [newMarket, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create market')
      throw err
    }
  }

  const resolveMarket = async (marketId: string, outcome: boolean): Promise<void> => {
    try {
      setError(null)
      
      setMarkets(prev => prev.map(market => 
        market.id === marketId 
          ? { ...market, resolved: true, outcome }
          : market
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve market')
      throw err
    }
  }

  useEffect(() => {
    fetchMarkets()
  }, [filters?.category, filters?.resolved, filters?.search, filters?.sortBy, filters?.sortOrder])

  return {
    markets,
    loading,
    error,
    refetch: fetchMarkets,
    createMarket,
    resolveMarket
  }
}
```