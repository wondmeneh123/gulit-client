import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { apiClient } from '@/config/api'

interface UserData {
  id: string
  role: 'ADMIN' | 'CASHIER'
  fullName: string
  email: string
}

const generateLoanId = () => {
  // Generate a random 6-digit number
  const randomNum = Math.floor(100000 + Math.random() * 900000)
  return `LOAN-${randomNum}`
}

interface CreateLoanProps {
  onSuccess?: () => void;
}

export function CreateLoan({ onSuccess }: CreateLoanProps) {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cashiers, setCashiers] = useState<UserData[]>([])
  const [selectedCashier, setSelectedCashier] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCashiers = async () => {
      try {
        const response = await apiClient.get('/users/all');
        // Filter users whose role is 'CASHIER'
        const cashiersOnly = Array.isArray(response.data)
          ? response.data.filter((user: UserData) => user.role === 'CASHIER')
          : [];
        setCashiers(cashiersOnly);
      } catch (error) {
        console.error('Error fetching cashiers:', error)
        toast.error('Failed to fetch cashiers')
      }
    }

    fetchCashiers()
  }, [])

  const calculateLoanDetails = (amount: number) => {
    const deduction = amount * 0.1 // 10% deduction
    const actualAmount = amount - deduction // Amount received
    const dailyPayment = amount * 0.01 // 1% of requested amount per day
    const totalToPay = dailyPayment * 105 // Total to pay over 105 days
    const startDate = new Date()
    const expectDate = new Date()
    expectDate.setDate(startDate.getDate() + 105) // 105 days from start

    return {
      loanId: generateLoanId(),
      dailyPayment,
      startDate: startDate.toISOString(),
      expectDate: expectDate.toISOString(),
      remainingDays: 105,
      unpaidLoan: totalToPay,
      paidLoan: 0,
      status: 'PENDING' as const,
      requestedAmount: amount,
      actualAmount,
      deduction,
      totalToPay,
      assignedCashier: selectedCashier
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!selectedCashier) {
        throw new Error('Please select a cashier')
      }

      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error('Please enter a valid phone number')
      }

      const amount = parseFloat(loanAmount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid loan amount')
      }

      // Register user
      const registerResponse = await apiClient.post('/users/register', {
        username: username,
        fullName,
        password,
        phoneNumber,
        role: 'BORROWER'
      });

      const userId = registerResponse.data.user.id;

      const loanDetails = calculateLoanDetails(amount)

      // Create loan
      await apiClient.post('/loans', {
        userId,
        fullName,
        phoneNumber,
        loanAmount: amount,
        ...loanDetails
      });

      toast.success('Loan created successfully!')
      onSuccess?.()
      navigate('/loans')
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const calculatePreview = () => {
    const amount = parseFloat(loanAmount)
    if (isNaN(amount) || amount <= 0) return null

    const deduction = amount * 0.1
    const actualAmount = amount - deduction
    const dailyPayment = amount * 0.01
    const totalToPay = dailyPayment * 105

    return {
      requestedAmount: amount,
      deduction,
      actualAmount,
      totalToPay,
      dailyPayment
    }
  }

  const preview = calculatePreview()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => {
            const value = e.target.value;
            setFullName(value);
            // Generate username: lowercase, spaces to dots, add 2 random digits
            const base = value.trim().toLowerCase().replace(/\s+/g, ".");
            const randomDigits = Math.floor(10 + Math.random() * 90); // 2 digits
            setUsername(base ? `${base}${randomDigits}` : "");
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username (Auto-generated)</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          readOnly
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          placeholder="Enter phone number"
          pattern="[0-9]{10}"
          title="Please enter a valid 10-digit phone number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div className="flex gap-4 sm:flex-row w-full justify-between">
        
      <div className="space-y-2">
        <Label htmlFor="cashier">Assign Cashier</Label>
        <Select value={selectedCashier} onValueChange={setSelectedCashier}>
          <SelectTrigger>
            <SelectValue placeholder="Select a cashier" />
          </SelectTrigger>
          <SelectContent>
            {cashiers.map((cashier) => (
              <SelectItem key={cashier.id} value={cashier.id}>
                {cashier.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="loanAmount">Requested Loan Amount (Br)</Label>
        <Input
          id="loanAmount"
          type="number"
          value={loanAmount}
          onChange={(e) => setLoanAmount(e.target.value)}
          required
          min="0"
          step="0.01"
        />
      </div>
      </div>

      {preview && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Requested Amount:</span>
                <span className="font-medium">
                  {Number(preview.requestedAmount).toLocaleString()} Br
                </span>
              </div>
              <div className="flex justify-between text-red-500">
                <span className="text-sm">10% Deduction:</span>
                <span className="font-medium">
                  -{Number(preview.deduction).toLocaleString()} Br
                </span>
              </div>
              <div className="flex justify-between text-green-500">
                <span className="text-sm">Amount to Receive:</span>
                <span className="font-medium">
                  {Number(preview.actualAmount).toLocaleString()} Br
                </span>
              </div>
              <div className="flex justify-between text-blue-500">
                <span className="text-sm">Daily Payment:</span>
                <span className="font-medium">
                  {Number(preview.dailyPayment).toLocaleString()} Br
                </span>
              </div>
              <div className="flex justify-between text-purple-500">
                <span className="text-sm">Total to Pay Back:</span>
                <span className="font-medium">
                  {Number(preview.totalToPay).toLocaleString()} Br
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating...' : 'Create Loan'}
      </Button>
    </form>
  )
} 