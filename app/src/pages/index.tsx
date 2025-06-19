```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ChevronRightIcon, TrendingUpIcon, UsersIcon, ShieldCheckIcon, ZapIcon } from '@heroicons/react/24/outline'

interface Market {
  id: string
  title: string
  description: string
  yesPrice: number
  noPrice: number
  volume: number
  endDate: string
  category: string
}

interface Stats {
  totalVolume: number
  activeMarkets: number
  totalUsers: number
}

export default function HomePage() {
  const { connected, publicKey } = useWallet()
  const [markets, setMarkets] = useState<Market[]>([])
  const [stats, setStats] = useState<Stats>({ totalVolume: 0, activeMarkets: 0, totalUsers: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Mock data for demonstration
        const mockMarkets: Market[] = [
          {
            id: '1',
            title: 'Will Bitcoin reach $100k by end of 2024?',
            description: 'Prediction market for Bitcoin price reaching $100,000 USD',
            yesPrice: 0.65,
            noPrice: 0.35,
            volume: 125000,
            endDate: '2024-12-31',
            category: 'Crypto'
          },
          {
            id: '2',
            title: 'Will Solana surpass Ethereum in TVL?',
            description: 'Total Value Locked comparison between Solana and Ethereum',
            yesPrice: 0.23,
            noPrice: 0.77,
            volume: 89000,
            endDate: '2025-06-30',
            category: 'DeFi'
          },
          {
            id: '3',
            title: 'Next US Presidential Election Winner',
            description: 'Prediction market for the 2024 US Presidential Election',
            yesPrice: 0.52,
            noPrice: 0.48,
            volume: 2100000,
            endDate: '2024-11-05',
            category: 'Politics'
          }
        ]

        const mockStats: Stats = {
          totalVolume: 15600000,
          activeMarkets: 247,
          totalUsers: 12450
        }

        setMarkets(mockMarkets)
        setStats(mockStats)
      } catch (err) {
        setError('Failed to load market data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6366f1]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Data</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-white">Zentro</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <WalletMultiButton className="!bg-[#6366f1] hover:!bg-[#5855eb] !rounded-xl !font-medium" />
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
            The Future of
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">
              {' '}Prediction Markets
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Trade on the outcomes of real-world events with the power of Solana blockchain. 
            Fast, secure, and decentralized prediction markets for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-[#6366f1] hover:bg-[#5855eb] text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center">
              Start Trading
              <ChevronRightIcon className="ml-2 h-5 w-5" />
            </button>
            <button className="border border-gray-600 hover:border-[#06b6d4] text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center">
                <TrendingUpIcon className="h-8 w-8 text-[#06b6d4]" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalVolume)}</p>
                  <p className="text-gray-400">Total Volume</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center">
                <ZapIcon className="h-8 w-8 text-[#8b5cf6]" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-white">{formatNumber(stats.activeMarkets)}</p>
                  <p className="text-gray-400">Active Markets</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-[#6366f1]" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-white">{formatNumber(stats.totalUsers)}</p>
                  <p className="text-gray-400">Total Users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Featured Markets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
              <div key={market.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-[#6366f1]/50 transition-colors duration-200">
                <div className="mb-4">
                  <span className="inline-block bg-[#6366f1]/20 text-[#6366f1] px-3 py-1 rounded-full text-sm font-medium">
                    {market.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{market.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{market.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-4">
                    <div className="text-center">
                      <p className="text-green-400 font-bold">{(market.yesPrice * 100).toFixed(0)}¢</p>
                      <p className="text-xs text-gray-400">YES</p>
                    </div>
                    <div className="text-center">
                      <p className="text-red-400 font-bold">{(market.noPrice * 100).toFixed(0)}¢</p>
                      <p className="text-xs text-gray-400">NO</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{formatCurrency(market.volume)}</p>
                    <p className="text-xs text-gray-400">Volume</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors duration-200">
                    Buy YES
                  </button>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors duration-200">
                    Buy NO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Why Choose Zentro?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-[#6366f1]/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ZapIcon className="h-8 w-8 text-[#6366f1]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-400">Built on Solana for instant transactions and low fees</p>
            </div>
            <div className="text-center">
              <div className="bg-[#8b5cf6]/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-[#8b5cf6]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure & Transparent</h3>
              <p className="text-gray-400">Decentralized and auditable smart contracts</p>
            </div>
            <div className="text-center">
              <div className="bg-[#06b6d4]/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUpIcon className="h-8 w-8 text-[#06b6d4]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">High Liquidity</h3>
              <p className="text-gray-400">Deep markets with competitive pricing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Zentro</h2>
          <p className="text-gray-400 mb-6">The future of prediction markets on Solana</p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-[#6366f1] transition-colors duration-200">
              Documentation
            </a>
            <a href="#" className="text-gray-400 hover:text-[#6366f1] transition-colors duration-200">
              Discord
            </a>
            <a href="#" className="text-gray-400 hover:text-[#6366f1] transition-colors duration-200">
              Twitter
            </a>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-gray-500 text-sm">
              © 2024 Zentro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
```