import React from "react"
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'

interface Market {
  id: string
  title: string
  description: string
  yesPrice: number
  noPrice: number
  totalVolume: number
  participants: number
  endDate: Date
  category: string
  resolved: boolean
  outcome?: 'yes' | 'no'
}

interface BettingInterfaceProps {
  market: Market
  onBetPlaced?: (betId: string, amount: number, side: 'yes' | 'no') => void
}

interface BetState {
  side: 'yes' | 'no'
  amount: string
  shares: number
  potentialPayout: number
}

export default function BettingInterface({ market, onBetPlaced }: BettingInterfaceProps) {
  const { connected, publicKey, signTransaction } = useWallet()
  const [betState, setBetState] = useState<BetState>({
    side: 'yes',
    amount: '',
    shares: 0,
    potentialPayout: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
    }
  }, [connected, publicKey])

  useEffect(() => {
    calculateShares()
  }, [betState.amount, betState.side])

  const fetchBalance = async () => {
    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com')
      const balance = await connection.getBalance(publicKey!)
      setBalance(balance / 1e9) // Convert lamports to SOL
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    }
  }

  const calculateShares = () => {
    const amount = parseFloat(betState.amount) || 0
    if (amount <= 0) {
      setBetState(prev => ({ ...prev, shares: 0, potentialPayout: 0 }))
      return
    }

    const price = betState.side === 'yes' ? market.yesPrice : market.noPrice
    const shares = amount / price
    const potentialPayout = shares * 1 // Each share pays out 1 SOL if correct

    setBetState(prev => ({
      ...prev,
      shares: Math.round(shares * 100) / 100,
      potentialPayout: Math.round(potentialPayout * 100) / 100
    }))
  }

  const handleAmountChange = (value: string) => {
    // Only allow valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBetState(prev => ({ ...prev, amount: value }))
    }
  }

  const handleSideChange = (side: 'yes' | 'no') => {
    setBetState(prev => ({ ...prev, side }))
  }

  const handlePlaceBet = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setError('Please connect your wallet first')
      return
    }

    const amount = parseFloat(betState.amount)
    if (amount <= 0) {
      setError('Please enter a valid bet amount')
      return
    }

    if (amount > balance) {
      setError('Insufficient balance')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simulate bet placement transaction
      // In a real implementation, this would interact with your Solana program
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      onBetPlaced?.(betId, amount, betState.side)
      
      // Reset form
      setBetState({
        side: 'yes',
        amount: '',
        shares: 0,
        potentialPayout: 0
      })
      
      // Refresh balance
      await fetchBalance()
    } catch (err) {
      setError('Failed to place bet. Please try again.')
      console.error('Bet placement error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const yesPercentage = (market.yesPrice / (market.yesPrice + market.noPrice)) * 100
  const noPercentage = 100 - yesPercentage

  if (market.resolved) {
    return (
      <Card className="w-full max-w-md mx-auto border-2" style={{ borderColor: '#6366f1' }}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {market.outcome === 'yes' ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            Market Resolved
          </CardTitle>
          <CardDescription>
            Outcome: <Badge variant={market.outcome === 'yes' ? 'default' : 'secondary'}>
              {market.outcome?.toUpperCase()}
            </Badge>
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto border-2" style={{ borderColor: '#6366f1' }}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold" style={{ color: '#6366f1' }}>
          Place Your Bet
        </CardTitle>
        <CardDescription className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Volume: {market.totalVolume.toLocaleString()} SOL
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {market.participants} participants
            </span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Market Odds */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span>YES {yesPercentage.toFixed(1)}%</span>
            <span>NO {noPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={yesPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{market.yesPrice.toFixed(3)} SOL</span>
            <span>{market.noPrice.toFixed(3)} SOL</span>
          </div>
        </div>

        {/* Betting Interface */}
        <Tabs value={betState.side} onValueChange={(value) => handleSideChange(value as 'yes' | 'no')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="yes" 
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              YES
            </TabsTrigger>
            <TabsTrigger 
              value="no" 
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              NO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="yes" className="space-y-4 mt-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">
                Betting <strong>YES</strong> at {market.yesPrice.toFixed(3)} SOL per share
              </p>
            </div>
          </TabsContent>

          <TabsContent value="no" className="space-y-4 mt-4">
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                Betting <strong>NO</strong> at {market.noPrice.toFixed(3)} SOL per share
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Bet Amount (SOL)</Label>
          <Input
            id="amount"
            type="text"
            placeholder="0.00"
            value={betState.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="text-lg font-mono"
            style={{ borderColor: '#6366f1' }}
          />
          {connected && (
            <p className="text-xs text-gray-500">
              Balance: {balance.toFixed(4)} SOL
            </p>
          )}
        </div>

        {/* Bet Summary */}
        {betState.shares > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Shares:</span>
              <span className="font-mono">{betState.shares}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Potential Payout:</span>
              <span className="font-mono font-semibold" style={{ color: '#06b6d4' }}>
                {betState.potentialPayout.toFixed(3)} SOL
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Potential Profit:</span>
              <span className="font-mono font-semibold text-green-600">
                {(betState.potentialPayout - parseFloat(betState.amount || '0')).toFixed(3)} SOL
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Place Bet Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={!connected || isLoading || !betState.amount || parseFloat(betState.amount) <= 0}
          className="w-full text-white font-semibold"
          style={{ backgroundColor: '#6366f1' }}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Placing Bet...
            </>
          ) : !connected ? (
            'Connect Wallet'
          ) : (
            `Place ${betState.side.toUpperCase()} Bet`
          )}
        </Button>

        {/* Market End Date */}
        <div className="text-center text-xs text-gray-500">
          Market closes: {market.endDate.toLocaleDateString()} at {market.endDate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}
```