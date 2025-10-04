import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { Receipt, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const user = AuthService.getUser();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (user?.role === 'admin') {
        const [allExpenses, pendingApprovals] = await Promise.all([
          api.getAllExpenses(),
          api.getPendingApprovals(),
        ]);
        setExpenses(allExpenses);
        setApprovals(pendingApprovals);
      } else if (user?.role === 'manager') {
        const [myExpenses, pendingApprovals, teamExpenses] = await Promise.all([
          api.getMyExpenses(),
          api.getPendingApprovals(),
          api.getTeamExpenses(),
        ]);
        setExpenses([...myExpenses, ...teamExpenses]);
        setApprovals(pendingApprovals);
      } else {
        const myExpenses = await api.getMyExpenses();
        setExpenses(myExpenses);
      }
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: expenses.length,
    approved: expenses.filter(e => e.status === 'approved').length,
    rejected: expenses.filter(e => e.status === 'rejected').length,
    pending: expenses.filter(e => e.status === 'pending' || e.status === 'in_progress').length,
    totalAmount: expenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName || user?.email}
        </h1>
        <p className="text-muted-foreground">
          {user?.role === 'admin' && 'Manage all expenses and approvals across your organization'}
          {user?.role === 'manager' && 'Review and approve team expenses'}
          {user?.role === 'employee' && 'Track and submit your expense reimbursements'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {(user?.role === 'manager' || user?.role === 'admin') && approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvals.slice(0, 5).map((approval) => (
                <div key={approval.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{approval.expense?.description || 'Expense'}</p>
                    <p className="text-sm text-muted-foreground">
                      {approval.expense?.amount} - {approval.expense?.category}
                    </p>
                  </div>
                  <Badge variant="secondary">Awaiting Review</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.slice(0, 10).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.category} • {new Date(expense.expenseDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{expense.amount} {expense.currency}</span>
                  <Badge 
                    variant={
                      expense.status === 'approved' ? 'default' : 
                      expense.status === 'rejected' ? 'destructive' : 
                      'secondary'
                    }
                  >
                    {expense.status}
                  </Badge>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No expenses yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
