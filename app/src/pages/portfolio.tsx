```tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart, BarChart3, Wallet, RefreshCw } from 'lucide-react'

interface Position {
  id: string
  marketName: string
  side: 'YES' | 'NO'
  shares: number
  avgPrice: number
  currentPrice: number
  value: number
  pnl: number
  pnlPercentage: number
}

interface PortfolioStats {
  totalValue: number
  totalPnl: number
  totalPnlPercentage: number
  activePositions: number
  winRate: number
}

export default function Portfolio() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [balance, setBalance] = useState(0)
  const [positions, setPositions] = useState<Position[]>([])
  const [stats, setStats] = useState<PortfolioStats>({
    totalValue: 0,
    totalPnl: 0,
    totalPnlPercentage: 0,
    activePositions: 0,
    winRate: 0
  })

  const mockPositions: Position[] = [
    {
      id: '1',
      marketName: 'Will Bitcoin reach $100k by end of 2024?',
      side: 'YES',
      shares: 150,
      avgPrice: 0.65,
      currentPrice: 0.72,
      value: 108,
      pnl: 10.5,
      pnlPercentage: 10.77
    },
    {
      id: '2',
      marketName: 'Will Ethereum ETF be approved in Q1 2024?',
      side: 'NO',
      shares: 200,
      avgPrice: 0.45,
      currentPrice: 0.38,
      value: 76,
      pnl: -14,
      pnlPercentage: -15.56
    },
    {
      id: '3',
      marketName: 'Will Tesla stock hit $300 this year?',
      side: 'YES',
      shares: 100,
      avgPrice: 0.55,
      currentPrice: 0.61,
      value: 61,
      pnl: 6,
      pnlPercentage: 10.91
    },
    {
      id: '4',
      marketName: 'Will AI replace 50% of jobs by 2030?',
      side: 'NO',
      shares: 75,
      avgPrice: 0.70,
      currentPrice: 0.65,
      value: 48.75,
      pnl: -3.75,
      pnlPercentage: -7.14
    }
  ]

  const fetchBalance = async () => {
    if (!publicKey || !connection) return
    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchPortfolioData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPositions(mockPositions)
      
      const totalValue = mockPositions.reduce((sum, pos) => sum + pos.value, 0)
      const totalPnl = mockPositions.reduce((sum, pos) => sum + pos.pnl, 0)
      const totalCost = mockPositions.reduce((sum, pos) => sum + (pos.shares * pos.avgPrice), 0)
      const winningPositions = mockPositions.filter(pos => pos.pnl > 0).length
      
      setStats({
        totalValue,
        totalPnl,
        totalPnlPercentage: totalCost > 0 ? (totalPnl / totalCost) * 100 : 0,
        activePositions: mockPositions.length,
        winRate: mockPositions.length > 0 ? (winningPositions / mockPositions.length) * 100 : 0
      })
    } catch (error) {
      console.error('Error fetching portfolio data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await Promise.all([fetchBalance(), fetchPortfolioData()])
    setRefreshing(false)
  }

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
      fetchPortfolioData()
    }
  }, [connected, publicKey, connection])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Wallet className="w-16 h-16 text-slate-400 mb-6" />
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Connect Your Wallet</h1>
            <p className="text-slate-600 mb-8 max-w-md">
              Connect your Solana wallet to view your prediction market portfolio and track your positions.
            </p>
            <WalletMultiButton className="!bg-[#6366f1] hover:!bg-[#5855eb] !rounded-xl !font-medium !px-6 !py-3" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Portfolio</h1>
            <p className="text-slate-600">Track your prediction market positions and performance</p>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <WalletMultiButton className="!bg-[#6366f1] hover:!bg-[#5855eb] !rounded-xl !font-medium" />
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-[#6366f1]" />
            <h3 className="font-semibold text-slate-900">Wallet Balance</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{balance.toFixed(4)} SOL</p>
          <p className="text-sm text-slate-600 mt-1">
            {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1]"></div>
          </div>
        ) : (
          <>
            {/* Portfolio Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-[#06b6d4]" />
                  <h3 className="font-semibold text-slate-700">Total Value</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-[#8b5cf6]" />
                  <h3 className="font-semibold text-slate-700">Total P&L</h3>
                </div>
                <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.totalPnl)}
                </p>
                <p className={`text-sm ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(stats.totalPnlPercentage)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <PieChart className="w-5 h-5 text-[#6366f1]" />
                  <h3 className="font-semibold text-slate-700">Active Positions</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.activePositions}</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-slate-700">Win Rate</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.winRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Positions Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Active Positions</h2>
              </div>
              
              {positions.length === 0 ? (
                <div className="p-12 text-center">
                  <PieChart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No positions yet</h3>
                  <p className="text-slate-600">Start trading to see your positions here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-slate-700">Market</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Side</th>
                        <th className="text-right p-4 font-semibold text-slate-700">Shares</th>
                        <th className="text-right p-4 font-semibold text-slate-700">Avg Price</th>
                        <th className="text-right p-4 font-semibold text-slate-700">Current Price</th>
                        <th className="text-right p-4 font-semibold text-slate-700">Value</th>
                        <th className="text-right p-4 font-semibold text-slate-700">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((position) => (
                        <tr key={position.id} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className="p-4">
                            <div className="font-medium text-slate-900 max-w-xs truncate">
                              {position.marketName}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              position.side === 'YES' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {position.side}
                            </span>
                          </td>
                          <td className="p-4 text-right font-medium text-slate-900">
                            {position.shares}
                          </td>
                          <td className="p-4 text-right text-slate-600">
                            ${position.avgPrice.toFixed(2)}
                          </td>
                          <td className="p-4 text-right text-slate-600">
                            ${position.currentPrice.toFixed(2)}
                          </td>
                          <td className="p-4 text-right font-medium text-slate-900">
                            {formatCurrency(position.value)}
                          </td>
                          <td className="p-4 text-right">
                            <div className={`flex items-center justify-end gap-1 ${
                              position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {position.pnl >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />