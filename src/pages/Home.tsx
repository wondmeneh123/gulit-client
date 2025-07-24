import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Clock,
  TrendingUp,
  ArrowRight,
  Search,
  Download,
  FileText,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";

interface Payment {
  amount: number;
  paymentBy: string;
  paidAt: string;
  dateAndTime: string;
  loanId: string;
  fullName: string;
  borrowerName: string;
  status: "pending" | "approved";
  approvedBy?: string;
  paidBy: string;
  paidByUsername?: string;
}

interface CashierDetails {
  id: string;
  fullName: string;
  username: string;
}

interface PaymentStats {
  totalAmount: number;
  averageAmount: number;
  totalPayments: number;
}

interface Stats {
  totalLoans: number;
  totalDailyExpected: number;
  todayPayments: number;
  pendingPayments: number;
}

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats & { scope?: string }>({
    totalLoans: 0,
    totalDailyExpected: 0,
    todayPayments: 0,
    pendingPayments: 0,
    scope: 'total',
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFormat, setDateFormat] = useState("MMM dd, yyyy HH:mm");
  const [selectedCashier, setSelectedCashier] = useState("all");
  const [cashierDetails, setCashierDetails] = useState<CashierDetails[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalAmount: 0,
    averageAmount: 0,
    totalPayments: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStatsOrLoans = async () => {
      if (!user) return;
      const token = localStorage.getItem("token");
      if (user.role === "CASHIER") {
        // Fetch all loans and filter for assignedCashier === user.id
        const response = await axios.get("https://gulit-api.abido.dev/api/loans", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const allLoans = response.data;
        const assignedLoans = allLoans.filter((loan: any) => loan.assignedCashier === user.id);
        // Calculate stats
        const totalLoans = assignedLoans.length;
        const totalDailyExpected = assignedLoans.reduce((sum: number, loan: any) => sum + (loan.dailyPayment || 0), 0);
        // Today's actual payments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let todayPayments = 0;
        let pendingPayments = 0;
        assignedLoans.forEach((loan: any) => {
          if (Array.isArray(loan.payments)) {
            loan.payments.forEach((payment: any) => {
              const paidAt = new Date(payment.paidAt);
              if (payment.status === 'APPROVED' && paidAt >= today) {
                todayPayments += payment.amount;
              }
              if (payment.status === 'PENDING') {
                pendingPayments += payment.amount;
              }
            });
          }
        });
        setStats({
          totalLoans,
          totalDailyExpected,
          todayPayments,
          pendingPayments,
          scope: 'assigned',
        });
      } else {
        // Use backend stats for admin/other roles
        try {
          const response = await axios.get(
            "https://gulit-api.abido.dev/api/loans/dashboard",
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );
          setStats(response.data);
        } catch (error) {
          console.error("Error fetching stats:", error);
        }
      }
    };
    fetchStatsOrLoans();
  }, [user]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user || user.role !== "ADMIN") return;

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "https://gulit-api.abido.dev/api/payments/detailed",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        const allPayments = response.data;

        // Sort by date, newest first
        allPayments.sort(
          (a: Payment, b: Payment) =>
            new Date(b.dateAndTime).getTime() -
            new Date(a.dateAndTime).getTime()
        );

        setPayments(allPayments);
        setFilteredPayments(allPayments);
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    };

    fetchPayments();
  }, [user]);

  useEffect(() => {
    let filtered = payments;

    // Apply date filters
    if (startDate || endDate) {
      filtered = filtered.filter((payment) => {
        const paymentDate = new Date(payment.dateAndTime);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && end) {
          return paymentDate >= start && paymentDate <= end;
        } else if (start) {
          return paymentDate >= start;
        } else if (end) {
          return paymentDate <= end;
        }
        return true;
      });
    }

    // Apply cashier filter
    if (selectedCashier !== "all") {
      filtered = filtered.filter(
        (payment) => payment.paymentBy === selectedCashier
      );
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((payment) => {
        const loanId = payment.loanId?.toLowerCase() || "";
        const fullName = payment.borrowerName?.toLowerCase() || "";
        return loanId.includes(searchLower) || fullName.includes(searchLower);
      });
    }

    setFilteredPayments(filtered);
  }, [startDate, endDate, payments, searchTerm, selectedCashier]);

  useEffect(() => {
    // Calculate stats for filtered payments
    const stats = filteredPayments
      .filter((payment) => payment.status === "approved")
      .reduce(
        (acc, payment) => {
          acc.totalAmount += payment.amount;
          acc.totalPayments += 1;
          return acc;
        },
        { totalAmount: 0, totalPayments: 0 }
      );

    setPaymentStats({
      totalAmount: stats.totalAmount,
      averageAmount:
        stats.totalPayments > 0 ? stats.totalAmount / stats.totalPayments : 0,
      totalPayments: stats.totalPayments,
    });
  }, [filteredPayments]);

  useEffect(() => {
    const fetchCashierDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "https://gulit-api.abido.dev/api/payments/cashier/details",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        setCashierDetails(response.data);
      } catch (error) {
        console.error("Error fetching cashier details:", error);
      }
    };

    fetchCashierDetails();
  }, [user]);

  const handleExport = () => {
    const headers = ["Date & Time", "Loan ID", "Borrower", "Amount", "Paid By"];
    const csvContent = [
      headers.join(","),
      ...filteredPayments.map((payment) =>
        [
          payment.dateAndTime
            ? format(new Date(payment.dateAndTime), dateFormat)
            : "N/A",
          payment.loanId,
          payment.fullName,
          payment.amount,
          payment.paymentBy,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `payments_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text("Payment Report", 14, 15);

    // Add date range if selected
    if (startDate || endDate) {
      doc.setFontSize(10);
      doc.text(
        `Date Range: ${startDate || "Start"} to ${endDate || "End"}`,
        14,
        25
      );
    }

    // Add cashier filter if selected
    if (selectedCashier !== "all") {
      doc.setFontSize(10);
      doc.text(`Cashier: ${selectedCashier}`, 14, 35);
    }

    // Add table headers
    const headers = [
      "Loan ID",
      "Borrower",
      "Amount",
      "Payment By",
      "Date",
      "Status",
    ];
    const data = filteredPayments.map((payment) => [
      payment.loanId || "",
      payment.borrowerName || "",
      payment.amount.toString(),
      payment.paymentBy || "",
      payment.dateAndTime || "",
      payment.status,
    ]);

    // Add table
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: startDate || endDate || selectedCashier !== "all" ? 45 : 25,
      margin: { top: 20 },
    });

    // Save the PDF
    doc.save("payment-report.pdf");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-2 md:p-6 space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Loan Dashboard</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Overview of loan statistics and daily operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
            {user.role}
          </Badge>
          <Button
            onClick={() => navigate("/loans")}
            className="flex items-center gap-2 text-sm md:text-base"
          >
            View All Loans
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              {stats.scope === 'assigned' ? "Your Expected Daily Payments" : "Expected Daily Payments"}
            </CardTitle>
            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.totalDailyExpected.toLocaleString()} Br
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {stats.scope === 'assigned'
                ? 'Sum of daily payments for loans assigned to you'
                : 'Sum of all daily payments expected today'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              {stats.scope === 'assigned' ? "Your Actual Payments Today" : "Today's Actual Payments"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.todayPayments.toLocaleString()} Br
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {stats.scope === 'assigned'
                ? 'Total payments you collected today'
                : 'Total payments received today'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              {stats.scope === 'assigned' ? "Your Pending Payments" : "Pending Payments"}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {stats.pendingPayments?.toLocaleString() || 0} Br
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              {stats.scope === 'assigned'
                ? 'Payments waiting for your approval'
                : 'Total payments waiting for approval'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History for Admin and Cashier */}
      {user?.role === "ADMIN" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
              <div>
                <CardTitle className="text-lg md:text-xl">
                  Payment History
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  View all loan payments with filtering and export options
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger className="w-[140px] md:w-[180px] text-xs md:text-sm">
                    <SelectValue placeholder="Date Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MMM dd, yyyy HH:mm">
                      MMM dd, yyyy HH:mm
                    </SelectItem>
                    <SelectItem value="yyyy-MM-dd HH:mm">
                      yyyy-MM-dd HH:mm
                    </SelectItem>
                    <SelectItem value="dd/MM/yyyy HH:mm">
                      dd/MM/yyyy HH:mm
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex items-center gap-2 text-xs md:text-sm"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  className="flex items-center gap-2 text-xs md:text-sm"
                >
                  <FileText className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs md:text-sm font-medium mb-1 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by loan ID or borrower..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 text-xs md:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium mb-1 block">
                    Cashier
                  </label>
                  <Select
                    value={selectedCashier}
                    onValueChange={setSelectedCashier}
                  >
                    <SelectTrigger className="text-xs md:text-sm">
                      <SelectValue placeholder="Select Cashier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cashiers</SelectItem>
                      {cashierDetails.map((cashier) => (
                        <SelectItem key={cashier.id} value={cashier.fullName}>
                          {cashier.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium mb-1 block">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs md:text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium mb-1 block">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs md:text-sm"
                  />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium">
                      Total Amount
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg md:text-2xl font-bold">
                      {paymentStats.totalAmount.toLocaleString()} Br
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium">
                      Total Payments
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg md:text-2xl font-bold">
                      {paymentStats.totalPayments}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">
                        Loan ID
                      </TableHead>
                      <TableHead className="text-xs md:text-sm">Date</TableHead>
                      <TableHead className="text-xs md:text-sm">Time</TableHead>
                      <TableHead className="text-xs md:text-sm">
                        Borrower
                      </TableHead>
                      <TableHead className="text-xs md:text-sm">
                        Amount
                      </TableHead>
                      <TableHead className="text-xs md:text-sm">
                        Paid By
                      </TableHead>
                      <TableHead className="text-xs md:text-sm">
                        Status
                      </TableHead>
                      <TableHead className="text-xs md:text-sm">
                        Approved By
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-xs md:text-sm"
                        >
                          No payments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs md:text-sm">
                            {payment.loanId}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {payment.dateAndTime
                              ? format(
                                  new Date(payment.dateAndTime),
                                  "MMM dd, yyyy"
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {payment.dateAndTime
                              ? format(new Date(payment.dateAndTime), "HH:mm")
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {payment.borrowerName}
                          </TableCell>
                          <TableCell
                            className={`text-xs md:text-sm ${
                              payment.status === "approved"
                                ? "text-green-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {payment.amount.toLocaleString()} Br
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {payment.paidBy}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                payment.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {payment.approvedBy || "Pending"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Cards */}
    </div>
  );
};

export default Home;
