```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Calendar, Clock, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface MarketCategory {
  id: string
  name: string
  icon: React.ReactNode
}

interface CreateMarketForm {
  title: string
  description: string
  category: string
  endDate: string
  endTime: string
  outcomes: string[]
  initialLiquidity: number
}

const MARKET_CATEGORIES: MarketCategory[] = [
  { id: 'sports', name: 'Sports', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'politics', name: 'Politics', icon: <Calendar className="w-5 h-5" /> },
  { id: 'crypto', name: 'Cryptocurrency', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'entertainment', name: 'Entertainment', icon: <Clock className="w-5 h-5" /> },
  { id: 'technology', name: 'Technology', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'other', name: 'Other', icon: <AlertCircle className="w-5 h-5" /> }
]

export default function CreateMarketPage() {
  const { connected, publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  
  const [form, setForm] = useState<CreateMarketForm>({
    title: '',
    description: '',
    category: '',
    endDate: '',
    endTime: '',
    outcomes: ['', ''],
    initialLiquidity: 1
  })

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
    }
  }, [connected, publicKey])

  const fetchBalance = async () => {
    if (!publicKey || !connection) return
    
    try {
      setIsLoading(true)
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (err) {
      console.error('Error fetching balance:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateMarketForm, value: string | number) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...form.outcomes]
    newOutcomes[index] = value
    setForm(prev => ({
      ...prev,
      outcomes: newOutcomes
    }))
    setError(null)
  }

  const addOutcome = () => {
    if (form.outcomes.length < 10) {
      setForm(prev => ({
        ...prev,
        outcomes: [...prev.outcomes, '']
      }))
    }
  }

  const removeOutcome = (index: number) => {
    if (form.outcomes.length > 2) {
      const newOutcomes = form.outcomes.filter((_, i) => i !== index)
      setForm(prev => ({
        ...prev,
        outcomes: newOutcomes
      }))
    }
  }

  const validateForm = (): string | null => {
    if (!form.title.trim()) return 'Market title is required'
    if (!form.description.trim()) return 'Market description is required'
    if (!form.category) return 'Please select a category'
    if (!form.endDate) return 'End date is required'
    if (!form.endTime) return 'End time is required'
    if (form.outcomes.some(outcome => !outcome.trim())) return 'All outcomes must be filled'
    if (form.outcomes.length < 2) return 'At least 2 outcomes are required'
    if (form.initialLiquidity < 0.1) return 'Minimum initial liquidity is 0.1 SOL'
    
    const endDateTime = new Date(`${form.endDate}T${form.endTime}`)
    if (endDateTime <= new Date()) return 'End date must be in the future'
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!connected || !publicKey || !signTransaction) {
      setError('Please connect your wallet first')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (balance === null || balance < form.initialLiquidity) {
      setError('Insufficient SOL balance')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create transaction for market creation
      const transaction = new Transaction()
      
      // Add instruction to transfer initial liquidity
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey('11111111111111111111111111111112'), // System program
        lamports: form.initialLiquidity * LAMPORTS_PER_SOL
      })
      
      transaction.add(transferInstruction)
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // Sign and send transaction
      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      
      // Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed')
      
      setSuccess(true)
      
      // Reset form
      setForm({
        title: '',
        description: '',
        category: '',
        endDate: '',
        endTime: '',
        outcomes: ['', ''],
        initialLiquidity: 1
      })
      
      // Refresh balance
      await fetchBalance()
      
    } catch (err) {
      console.error('Error creating market:', err)
      setError('Failed to create market. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Create Prediction Market
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Launch your own prediction market and let the community forecast the future
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4">
            <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-xl" />
            {connected && balance !== null && (
              <div className="flex items-center gap-2 text-slate-600">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">{balance.toFixed(4)} SOL</span>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Market Created Successfully!</h3>
                <p className="text-green-700">Your prediction market has been created and is now live.</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            {/* Market Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Market Title *
              </label>
              <input
                type="text"
                id="title"
                value={form.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Will Bitcoin reach $100,000 by end of 2024?"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                maxLength={200}
              />
            </div>

            {/* Market Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Market Description *
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide detailed information about the market conditions, resolution criteria, and any relevant context..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                maxLength={1000}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MARKET_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleInputChange('category', category.id)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      form.category === category.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {category.icon}
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* End Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={form.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={getTomorrowDate()}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={form.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Outcomes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Possible Outcomes *
              </label>
              <div className="space-y-3">
                {form.outcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={outcome}
                      onChange={(e) => handleOutcomeChange(index, e.target.value)}
                      placeholder={`Outcome ${index + 1}`}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      maxLength={100}
                    />
                    {form.outcomes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOutcome(index)}
                        className="px-3 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {form.outcomes.length < 10 && (
                <button
                  type="button"
                  onClick={addOutcome}
                  className="mt-3 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors text-sm font-medium"
                >
                  + Add Outcome
                </button>
              )}
            </div>

            {/* Initial Liquidity */}
            <div>
              <label htmlFor="liquidity" className="block text-sm font-medium text-slate-700 mb-2">
                Initial Liquidity (SOL) *
              </label>
              <input
                type="number"
                id="liquidity"
                value={form.initialLiquidity}
                onChange={(e) => handleInputChange('initialLiquidity', parseFloat(e.target.value) || 0)}
                min="0.1"
                step="0.1"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo