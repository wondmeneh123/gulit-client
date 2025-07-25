import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiClient } from "@/config/api";
import { CreateLoan } from "./create-loan";
import { Eye, Pencil, ChevronLeft, ChevronRight, Edit2 } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  paymentBy: string;
  paidAt: string;
  status: "PENDING" | "APPROVED" | string;
}

interface Loan {
  id: string;
  userId: string;
  fullName: string;
  loanId: string;
  loanAmount: number;
  dailyPayment: number;
  startDate: string;
  expectDate: string;
  remainingDays: number;
  unpaidLoan: number;
  paidLoan: number;
  status: "PENDING" | "APPROVED" | "DENIED" | "COMPLETED" | "OVERDUE";
  requestedAmount: number;
  deduction: number;
  actualAmount: number;
  totalToPay: number;
  payments?: Payment[];
  assignedCashier: string;
}

export function LoanTable() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Loan>("startDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [printLoan, setPrintLoan] = useState<Loan | null>(null);
  const [printUser, setPrintUser] = useState<any | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchLoans();
  }, [user]);

  const fetchLoans = async () => {
    try {
      const response = await apiClient.get("/loans");
      setLoans(response.data);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Loan) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleView = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsViewOpen(true);
  };

  const handleAddPayment = (loan: Loan) => {
    setSelectedLoan(loan);
    setNewPaymentAmount("");
    setIsUpdateOpen(true);
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !user) return;

    try {
      const paymentAmount = Number(newPaymentAmount);

      if (paymentAmount <= 0) {
        alert("Payment amount must be greater than 0");
        return;
      }

      // Create new payment with the actual payment amount
      const paymentResponse = await apiClient.post("/payments", {
        loanId: selectedLoan.id,
        amount: paymentAmount,
        paymentBy: user.fullName,
        userId: user.id,
      });

      // If user is accountant, approve the payment immediately
      if (user.role === "ACCOUNTANT") {
        await apiClient.patch(`/payments/${paymentResponse.data.id}`, {
          status: "APPROVED",
        });
      }

      // Refresh loans to get updated data
      await fetchLoans();
      setIsUpdateOpen(false);
      setNewPaymentAmount("");
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await apiClient.patch(`/payments/${paymentId}`, {
        status: "APPROVED",
      });

      // Refresh loans to get updated data
      await fetchLoans();
      setIsViewOpen(false);
    } catch (error) {
      console.error("Error approving payment:", error);
    }
  };

  const handlePrint = async (loan: Loan) => {
    // If loan already has user info, use it; otherwise fetch
    if ((loan as any).user && (loan as any).user.fullName) {
      setPrintLoan(loan);
      setPrintUser((loan as any).user);
      setShowPrintDialog(true);
    } else {
      try {
        const response = await apiClient.get(`/users/profile`);
        setPrintLoan(loan);
        setPrintUser(response.data);
        setShowPrintDialog(true);
      } catch (err) {
        setPrintLoan(loan);
        setPrintUser(null);
        setShowPrintDialog(true);
      }
    }
  };

  const handleEditLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsUpdateOpen(true); // Reuse isUpdateOpen for edit dialog
  };

  const handleEditLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !user) return;

    try {
      const updatedLoanData = {
        requestedAmount: selectedLoan.requestedAmount,
        deduction: selectedLoan.deduction,
        actualAmount: selectedLoan.actualAmount,
        totalToPay: selectedLoan.totalToPay,
        dailyPayment: selectedLoan.dailyPayment,
        expectDate: selectedLoan.expectDate,
        status: selectedLoan.status,
      };

      await apiClient.patch(`/loans/${selectedLoan.id}`, updatedLoanData);
      await fetchLoans();
      setIsUpdateOpen(false);
      setSelectedLoan(null);
    } catch (error) {
      console.error("Error updating loan:", error);
    }
  };

  const filteredAndSortedLoans = loans
    .filter((loan) => {
      // If cashier, only show loans assigned to them
      if (user?.role === "CASHIER") {
        return loan.assignedCashier === user.id;
      }
      // Otherwise, show all loans
      return true;
    })
    .filter((loan) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (loan.fullName?.toLowerCase() || "").includes(searchLower) ||
        (loan.userId?.toLowerCase() || "").includes(searchLower) ||
        (loan.loanId?.toLowerCase() || "").includes(searchLower)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const direction = sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction * aValue.localeCompare(bValue);
      }
      return direction * (Number(aValue) - Number(bValue));
    });

  // Calculate pagination values
  const totalPages = Math.ceil(filteredAndSortedLoans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLoans = filteredAndSortedLoans.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  console.log(loans);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <Input
          placeholder="Search by name, ID, or loan ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm text-xs md:text-sm"
        />
        {user?.role === "ADMIN" || user?.role === "ACCOUNTANT" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto text-xs md:text-sm">
                Create New Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] max-w-7xl">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">
                  Create New Loan
                </DialogTitle>
              </DialogHeader>
              <CreateLoan
                onSuccess={() => {
                  // Close dialog and refresh loans
                  const dialogTrigger = document.querySelector(
                    '[data-state="open"]'
                  );
                  if (dialogTrigger) {
                    (dialogTrigger as HTMLButtonElement).click();
                  }
                  fetchLoans();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort("fullName")}
                className="cursor-pointer text-xs md:text-sm whitespace-nowrap"
              >
                Full Name{" "}
                {sortField === "fullName" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("requestedAmount")}
                className="cursor-pointer text-xs md:text-sm whitespace-nowrap"
              >
                Requested{" "}
                {sortField === "requestedAmount" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("totalToPay")}
                className="cursor-pointer text-xs md:text-sm whitespace-nowrap"
              >
                Total{" "}
                {sortField === "totalToPay" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("dailyPayment")}
                className="cursor-pointer text-xs md:text-sm whitespace-nowrap"
              >
                Daily{" "}
                {sortField === "dailyPayment" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("paidLoan")}
                className="cursor-pointer text-xs md:text-sm whitespace-nowrap"
              >
                Paid{" "}
                {sortField === "paidLoan" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("startDate")}
                className="cursor-pointer text-xs md:text-sm whitespace-nowrap"
              >
                Start{" "}
                {sortField === "startDate" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("expectDate")}
                className="cursor-pointer text-xs md:text-sm whitespace-nowrap"
              >
                Expected{" "}
                {sortField === "expectDate" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("remainingDays")}
                className="cursor-pointer text-xs md:text-sm whitespace-nowrap"
              >
                Days{" "}
                {sortField === "remainingDays" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>

              <TableHead className="text-xs md:text-sm whitespace-nowrap">
                Remaining
              </TableHead>
              <TableHead className="text-xs md:text-sm whitespace-nowrap">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center text-xs md:text-sm"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedLoans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center text-xs md:text-sm"
                >
                  No loans found
                </TableCell>
              </TableRow>
            ) : (
              paginatedLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="text-xs md:text-sm">
                    {loan.fullName}
                  </TableCell>
                  <TableCell className="text-xs md:text-sm">
                    {formatCurrency(loan.requestedAmount)} Br
                  </TableCell>
                  <TableCell className="text-blue-500 text-xs md:text-sm">
                    {formatCurrency(loan.totalToPay)} Br
                  </TableCell>
                  <TableCell className="text-xs md:text-sm">
                    {formatCurrency(loan.dailyPayment)} Br
                  </TableCell>
                  <TableCell className="text-purple-500 text-xs md:text-sm">
                    {formatCurrency(loan.paidLoan)} Br
                  </TableCell>
                  <TableCell className="text-xs md:text-sm">
                    {formatDate(loan.startDate)}
                  </TableCell>
                  <TableCell className="text-xs md:text-sm">
                    {formatDate(loan.expectDate)}
                  </TableCell>
                  <TableCell className="text-xs md:text-sm">
                    {loan.remainingDays}
                  </TableCell>

                  <TableCell className="text-red-500 text-xs md:text-sm">
                    {formatCurrency(loan.remainingDays * loan.dailyPayment)} Br
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 md:gap-2">
                      {user?.role !== "ACCOUNTANT" && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 md:h-8 md:w-8"
                          onClick={() => handleView(loan)}
                        >
                          <Eye className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      )}

                      {user?.role !== "ACCOUNTANT" && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 md:h-8 md:w-8"
                          onClick={() => handleAddPayment(loan)}
                          title="Add New Payment"
                        >
                          <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      )}
                      {user?.role !== "ACCOUNTANT" && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 md:h-8 md:w-8"
                          onClick={() => handleEditLoan(loan)}
                          title="Edit Loan"
                        >
                          <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 md:h-8 md:w-8"
                        onClick={() => handlePrint(loan)}
                        title="Print Loan & User Info"
                      >
                        🖨️
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add pagination controls */}
      {!loading && filteredAndSortedLoans.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredAndSortedLoans.length)}{" "}
            of {filteredAndSortedLoans.length} entries
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
            <div className="text-sm">
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

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[60vw] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              Loan Details
            </DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label className="text-xs md:text-sm">Loan ID</Label>
                  <p className="font-mono text-xs md:text-sm">
                    {selectedLoan.loanId}
                  </p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Full Name</Label>
                  <p className="text-xs md:text-sm">{selectedLoan.fullName}</p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Requested Amount</Label>
                  <p className="text-xs md:text-sm">
                    {formatCurrency(selectedLoan.requestedAmount)} Br
                  </p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Deduction (10%)</Label>
                  <p className="text-red-500 text-xs md:text-sm">
                    -{formatCurrency(selectedLoan.deduction)} Br
                  </p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Amount Received</Label>
                  <p className="text-green-500 text-xs md:text-sm">
                    {formatCurrency(selectedLoan.actualAmount)} Br
                  </p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Total to Pay</Label>
                  <p className="text-blue-500 text-xs md:text-sm">
                    {formatCurrency(selectedLoan.totalToPay)} Br
                  </p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Daily Payment</Label>
                  <p className="text-xs md:text-sm">
                    {formatCurrency(selectedLoan.dailyPayment)} Br
                  </p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Unpaid Payment</Label>
                  <p className="text-xs md:text-sm">
                    {formatCurrency(
                      selectedLoan.remainingDays * selectedLoan.dailyPayment
                    )}{" "}
                    Br
                  </p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Paid Amount</Label>
                  <p className="text-purple-500 text-xs md:text-sm">
                    {formatCurrency(selectedLoan.paidLoan)} Br
                  </p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Start Date</Label>
                  <p className="text-xs md:text-sm">
                    {formatDate(selectedLoan.startDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Expected Date</Label>
                  <p className="text-xs md:text-sm">
                    {formatDate(selectedLoan.expectDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs md:text-sm">Remaining Days</Label>
                  <p className="text-xs md:text-sm">
                    {selectedLoan.remainingDays}
                  </p>
                </div>
              </div>

              {/* Payment History */}
              {selectedLoan.payments && selectedLoan.payments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base md:text-lg font-semibold">
                    Payment History
                  </h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs md:text-sm">
                            Amount
                          </TableHead>
                          <TableHead className="text-xs md:text-sm">
                            Paid By
                          </TableHead>
                          <TableHead className="text-xs md:text-sm">
                            Date & Time
                          </TableHead>
                          <TableHead className="text-xs md:text-sm">
                            Status
                          </TableHead>
                          {user?.role === "ACCOUNTANT" && (
                            <TableHead className="text-xs md:text-sm">
                              Actions
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedLoan.payments
                          .sort(
                            (a, b) =>
                              new Date(b.paidAt).getTime() -
                              new Date(a.paidAt).getTime()
                          )
                          .map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell
                                className={`text-xs md:text-sm ${
                                  payment.status === "APPROVED"
                                    ? "text-green-500"
                                    : "text-yellow-500"
                                }`}
                              >
                                {formatCurrency(payment.amount)} Br
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                {payment.paymentBy}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                {new Date(payment.paidAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    payment.status === "APPROVED"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {payment.status}
                                </span>
                              </TableCell>
                              {user?.role === "ACCOUNTANT" &&
                                payment.status === "PENDING" && (
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleApprovePayment(payment.id)
                                      }
                                      className="text-xs"
                                    >
                                      Approve
                                    </Button>
                                  </TableCell>
                                )}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Approved Payments:{" "}
                    {formatCurrency(
                      selectedLoan.payments
                        .filter((p) => p.status === "APPROVED")
                        .reduce((sum, p) => sum + p.amount, 0)
                    )}{" "}
                    Br
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Modal */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[60vw] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              Edit Loan Amount
            </DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <form onSubmit={handleEditLoanSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requestedAmount" className="text-xs md:text-sm">
                  Requested Amount
                </Label>
                <Input
                  id="requestedAmount"
                  type="number"
                  value={selectedLoan.requestedAmount}
                  onChange={(e) => {
                    const requestedAmount = Number(e.target.value);
                    const deduction = requestedAmount * 0.15;
                    const actualAmount = requestedAmount - deduction;
                    const totalToPay = requestedAmount * 1.15;
                    const dailyPayment = totalToPay / 105;
                    setSelectedLoan({
                      ...selectedLoan,
                      requestedAmount,
                      deduction,
                      actualAmount,
                      totalToPay,
                      dailyPayment,
                    });
                  }}
                  min="0"
                  step="0.01"
                  required
                  placeholder="Enter requested amount"
                  className="text-xs md:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs md:text-sm">Deduction (15%)</Label>
                <p className="text-red-500 text-xs md:text-sm">
                  -{formatCurrency(selectedLoan.deduction)} Br
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs md:text-sm">Amount Received</Label>
                <p className="text-green-500 text-xs md:text-sm">
                  {formatCurrency(selectedLoan.actualAmount)} Br
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs md:text-sm">Total to Pay</Label>
                <p className="text-blue-500 text-xs md:text-sm">
                  {formatCurrency(selectedLoan.totalToPay)} Br
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs md:text-sm">Daily Payment</Label>
                <p className="text-xs md:text-sm">
                  {formatCurrency(selectedLoan.dailyPayment)} Br
                </p>
              </div>
              <Button type="submit" className="w-full text-xs md:text-sm">
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-lg print:block">
          <DialogHeader>
            <DialogTitle>Loan & User Info</DialogTitle>
          </DialogHeader>
          {printLoan && printUser ? (
            <div id="print-section" className="space-y-2">
              <div>
                <b>User Full Name:</b> {printUser.fullName}
              </div>
              <div>
                <b>Username:</b> {printUser.username}
              </div>
              <div>
                <b>Phone:</b> {printUser.phoneNumber}
              </div>
              <div>
                <b>Default Password:</b> 12345678
              </div>
              <hr />
              <div>
                <b>Loan ID:</b> {printLoan.loanId}
              </div>
              <div>
                <b>Loan Amount:</b> {formatCurrency(printLoan.loanAmount)} Br
              </div>
              <div>
                <b>Daily Payment:</b> {formatCurrency(printLoan.dailyPayment)}{" "}
                Br
              </div>
              <div>
                <b>Total to Pay:</b> {formatCurrency(printLoan.totalToPay)} Br
              </div>
              <div>
                <b>Start Date:</b>{" "}
                {new Date(printLoan.startDate).toLocaleDateString()}
              </div>
              <div>
                <b>Expected End:</b>{" "}
                {new Date(printLoan.expectDate).toLocaleDateString()}
              </div>
              <div>
                <b>Status:</b> {printLoan.status}
              </div>
            </div>
          ) : (
            <div>Loading info...</div>
          )}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => {
                const printContents =
                  document.getElementById("print-section")?.innerHTML;
                const printWindow = window.open("", "", "height=600,width=800");
                if (printWindow && printContents) {
                  printWindow.document.write(
                    "<html><head><title>Print Loan & User Info</title>"
                  );
                  printWindow.document.write("</head><body >");
                  printWindow.document.write(printContents);
                  printWindow.document.write("</body></html>");
                  printWindow.document.close();
                  printWindow.print();
                }
              }}
            >
              Print
            </Button>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
