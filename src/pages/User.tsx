import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '@/config/api'
import { CreditCard, DollarSign, User2 } from "lucide-react"

interface Loan {
  id: string
  loanId: string
  totalToPay: number
  paidLoan: number
  unpaidLoan: number
  dailyPayment: number
  remainingDays: number
  status: string
  startDate: string
  expectDate: string
  payments: Array<{
    amount: number
    paymentBy: string
    paidAt: string
    status: string
  }>
}

const User = () => {
  const { user, logout } = useAuth()
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        if (!user?.id) {
          throw new Error('User not authenticated')
        }

        const response = await apiClient.get(`/loans/user/${user.id}`)
        setLoan(response.data)

      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch loan data')
      } finally {
        setLoading(false)
      }
    }

    fetchLoanData()
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!loan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">No Loan Found</h1>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen max-w-screen-xl mx-auto flex flex-col items-center justify-center">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-yellow-200 via-blue-200 to-purple-200 blur-2xl opacity-60" />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex flex-col xs:flex-row items-start xs:items-center gap-2">
            <span className="flex items-center gap-2">
              <User2 className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-500" />
              <span>
                Welcome, {user?.fullName}
              </span>
            </span>
            <span className="ml-0 xs:ml-2 mt-1 xs:mt-0 text-sm sm:text-base font-normal text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
              {user?.role}
            </span>
          </h1>
          <div className="w-full sm:w-auto mt-2 sm:mt-0 flex justify-end">
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/20 backdrop-blur-lg border border-white/30 shadow-xl rounded-2xl p-6 transition-transform hover:scale-[1.02]">
            <CardHeader className="flex items-center gap-2">
              <CreditCard className="text-blue-500" />
              <CardTitle>Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1"><User2 className="w-4 h-4" /> Loan ID:</span>
                <span className="font-medium">{loan.loanId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Total Amount:</span>
                <span className="font-medium">{loan.totalToPay} Br</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Daily Payment:</span>
                <span className="font-medium">{loan.dailyPayment} Br</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remaining Days:</span>
                <span className="font-medium">{loan.remainingDays} days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Paid Amount:</span>
                <span className="font-medium text-green-500">{loan.paidLoan} Br</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remaining Amount:</span>
                <span className="font-medium text-red-500">{loan.unpaidLoan} Br</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${
                  loan.status === 'completed' ? 'text-green-500' :
                  loan.status === 'overdue' ? 'text-red-500' :
                  'text-yellow-500'
                }`}>
                  {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Start Date:</span>
                <span className="font-medium">{new Date(loan.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expected End:</span>
                <span className="font-medium">{new Date(loan.expectDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {loan.payments && loan.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loan.payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{payment.amount} Br</div>
                      <div className="text-sm text-gray-500">
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.paymentBy}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default User