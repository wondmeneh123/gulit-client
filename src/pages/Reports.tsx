import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { apiClient } from '@/config/api'

interface Payment {
  id: string
  amount: number
  paymentBy: string
  paidAt: string
  status: 'PENDING' | 'APPROVED' | string
}

interface Loan {
  id: string
  userId: string
  fullName: string
  loanId: string
  loanAmount: number
  dailyPayment: number
  startDate: string
  expectDate: string
  remainingDays: number
  unpaidLoan: number
  paidLoan: number
  status: string
  requestedAmount: number
  deduction: number
  actualAmount: number
  totalToPay: number
  payments?: Payment[]
  assignedCashier: string
}

const Reports = () => {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      const response = await apiClient.get('/loans')
      setLoans(response.data)
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }


  // Calculate unpaid days using the formula: x - y
  // x = days since loan started (selected_date - start_date) - DYNAMIC CURRENT DATE
  // y = days that should have been paid (105 - remaining_days)
  // unpaid_days = x - y
  const calculateUnpaidDays = (loan: Loan) => {
    // Use selected date as the "current date" for calculations
    const dynamicCurrentDate = new Date(selectedDate)
    const startDate = new Date(loan.startDate)
    
    // Calculate x: days since loan started up to selected date (dynamic current date)
    // Reset time to midnight for accurate day calculation
    dynamicCurrentDate.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)
    
    const timeDiff = dynamicCurrentDate.getTime() - startDate.getTime()
    const x = Math.floor(timeDiff / (1000 * 3600 * 24))
    
    // Calculate y: days that should have been paid
    const y = 105 - loan.remainingDays
    
    // Calculate unpaid days
    const unpaidDays = x - y
    
    return {
      daysSinceStart: x,
      daysShouldHavePaid: y,
      unpaidDays: unpaidDays
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(loans.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLoans = loans.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // Calculate summary statistics
  const summaryStats = loans.reduce((acc, loan) => {
    const { unpaidDays } = calculateUnpaidDays(loan)
    if (unpaidDays > 0) acc.overdue++
    else if (unpaidDays < 0) acc.ahead++
    else acc.onTrack++
    return acc
  }, { overdue: 0, ahead: 0, onTrack: 0 })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Loan Payment Reports</h1>
        <p className="text-muted-foreground">Track loan performance and payment status</p>
      </div>

      {/* Date Picker */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="date-picker" className="text-sm font-medium">
                Calculate From Date:
              </Label>
            </div>
            <Input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Loans</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {summaryStats.overdue}
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Loans behind on payments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {summaryStats.onTrack}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Loans up to date
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ahead of Schedule</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {summaryStats.ahead}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Loans ahead on payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Loan Payment Analysis</CardTitle>
          </div>
          <CardDescription>
            Detailed view of loan payment status and calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Full Name</TableHead>
                  <TableHead className="font-medium">Days Since Start (x)</TableHead>
                  <TableHead className="font-medium">Should Have Paid (y)</TableHead>
                  <TableHead className="font-medium">Unpaid Days (x-y)</TableHead>
                  <TableHead className="font-medium">Remarks</TableHead>
                  <TableHead className="font-medium">Daily Payment</TableHead>
                  <TableHead className="font-medium">Paid on Selected Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
                        <span className="text-muted-foreground">Loading loans...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedLoans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                        <p>No loans found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLoans.map(loan => {
                    const { daysSinceStart, daysShouldHavePaid, unpaidDays } = calculateUnpaidDays(loan)
                    const paidOnSelectedDate = loan.payments?.filter(payment => {
                      if (payment.status !== 'APPROVED') return false
                      const paidAt = new Date(payment.paidAt)
                      const selectedDateObj = new Date(selectedDate)
                      return paidAt.getFullYear() === selectedDateObj.getFullYear() &&
                        paidAt.getMonth() === selectedDateObj.getMonth() &&
                        paidAt.getDate() === selectedDateObj.getDate()
                    }) || []
                    
                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.fullName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {daysSinceStart} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {daysShouldHavePaid} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={unpaidDays > 0 ? "destructive" : unpaidDays < 0 ? "default" : "secondary"}
                          >
                            {unpaidDays}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {unpaidDays < 0
                              ? `Already paid for ${Math.abs(unpaidDays)} more day(s)`
                              : unpaidDays > 0
                                ? `${unpaidDays} day(s) not paid`
                                : 'Up to date'}
                          </Badge>
                        </TableCell>
                        <TableCell>{loan.dailyPayment} Br</TableCell>
                        <TableCell>
                          {paidOnSelectedDate.length > 0 ? (
                            <Badge variant="outline">
                              {paidOnSelectedDate.reduce((sum, p) => sum + p.amount, 0)} Br
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && loans.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, loans.length)} of {loans.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Reports