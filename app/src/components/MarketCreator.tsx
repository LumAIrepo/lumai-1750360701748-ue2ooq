import React from "react"
```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'

interface MarketCreatorProps {
  onMarketCreated?: (marketId: string) => void
  className?: string
}

interface MarketOutcome {
  id: string
  title: string
  description: string
}

export default function MarketCreator({ onMarketCreated, className }: MarketCreatorProps) {
  const { connected, publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [endDate, setEndDate] = useState<Date>()
  const [outcomes, setOutcomes] = useState<MarketOutcome[]>([
    { id: '1', title: 'Yes', description: '' },
    { id: '2', title: 'No', description: '' }
  ])
  const [initialLiquidity, setInitialLiquidity] = useState('')
  const [resolutionSource, setResolutionSource] = useState('')

  const addOutcome = () => {
    const newOutcome: MarketOutcome = {
      id: Date.now().toString(),
      title: '',
      description: ''
    }
    setOutcomes([...outcomes, newOutcome])
  }

  const removeOutcome = (id: string) => {
    if (outcomes.length > 2) {
      setOutcomes(outcomes.filter(outcome => outcome.id !== id))
    }
  }

  const updateOutcome = (id: string, field: keyof MarketOutcome, value: string) => {
    setOutcomes(outcomes.map(outcome => 
      outcome.id === id ? { ...outcome, [field]: value } : outcome
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!title || !description || !category || !endDate || !initialLiquidity) {
      toast.error('Please fill in all required fields')
      return
    }

    if (outcomes.some(outcome => !outcome.title)) {
      toast.error('Please provide titles for all outcomes')
      return
    }

    setIsLoading(true)

    try {
      // Simulate market creation - replace with actual Solana program interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const marketId = `market_${Date.now()}`
      
      toast.success('Market created successfully!')
      onMarketCreated?.(marketId)
      
      // Reset form
      setTitle('')
      setDescription('')
      setCategory('')
      setEndDate(undefined)
      setOutcomes([
        { id: '1', title: 'Yes', description: '' },
        { id: '2', title: 'No', description: '' }
      ])
      setInitialLiquidity('')
      setResolutionSource('')
      
    } catch (error) {
      console.error('Error creating market:', error)
      toast.error('Failed to create market. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)} style={{ borderRadius: '0.75rem' }}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold" style={{ color: '#6366f1' }}>
          Create Prediction Market
        </CardTitle>
        <CardDescription>
          Set up a new prediction market for the community to trade on
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Market Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Will Bitcoin reach $100,000 by end of 2024?"
                className="w-full"
                style={{ borderRadius: '0.75rem' }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Market Description *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information about the market conditions, resolution criteria, and any relevant context..."
                className="min-h-[100px]"
                style={{ borderRadius: '0.75rem' }}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category *
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger style={{ borderRadius: '0.75rem' }}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="politics">Politics</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  End Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                      style={{ borderRadius: '0.75rem' }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Outcomes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Market Outcomes *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOutcome}
                className="flex items-center gap-2"
                style={{ borderRadius: '0.75rem' }}
              >
                <Plus className="h-4 w-4" />
                Add Outcome
              </Button>
            </div>
            
            <div className="space-y-3">
              {outcomes.map((outcome, index) => (
                <div key={outcome.id} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={outcome.title}
                      onChange={(e) => updateOutcome(outcome.id, 'title', e.target.value)}
                      placeholder={`Outcome ${index + 1} title`}
                      style={{ borderRadius: '0.75rem' }}
                      required
                    />
                    <Input
                      value={outcome.description}
                      onChange={(e) => updateOutcome(outcome.id, 'description', e.target.value)}
                      placeholder="Optional description"
                      style={{ borderRadius: '0.75rem' }}
                    />
                  </div>
                  {outcomes.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOutcome(outcome.id)}
                      className="mt-0 text-red-600 hover:text-red-700"
                      style={{ borderRadius: '0.75rem' }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Market Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="liquidity" className="text-sm font-medium">
                  Initial Liquidity (SOL) *
                </Label>
                <Input
                  id="liquidity"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={initialLiquidity}
                  onChange={(e) => setInitialLiquidity(e.target.value)}
                  placeholder="e.g., 10"
                  style={{ borderRadius: '0.75rem' }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution" className="text-sm font-medium">
                  Resolution Source
                </Label>
                <Input
                  id="resolution"
                  value={resolutionSource}
                  onChange={(e) => setResolutionSource(e.target.value)}
                  placeholder="e.g., CoinGecko, Official announcement"
                  style={{ borderRadius: '0.75rem' }}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={!connected || isLoading}
              className="px-8 py-2 font-medium text-white"
              style={{ 
                backgroundColor: '#6366f1',
                borderRadius: '0.75rem'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Market...
                </>
              ) : (
                'Create Market'
              )}
            </Button>
          </div>

          {!connected && (
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                Please connect your Solana wallet to create a market
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
```