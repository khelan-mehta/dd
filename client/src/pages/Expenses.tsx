import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { Plus } from 'lucide-react';

export default function Expenses() {
  const user = AuthService.getUser();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      if (user?.role === 'admin') {
        const data = await api.getAllExpenses();
        setExpenses(data);
      } else {
        const data = await api.getMyExpenses();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Failed to load expenses', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {user?.role === 'admin' ? 'All Expenses' : 'My Expenses'}
          </h1>
          <p className="text-muted-foreground">
            View and manage expense reimbursements
          </p>
        </div>
        {user?.role !== 'admin' && (
          <Link to="/expenses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Submit Expense
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Converted</TableHead>
                <TableHead>Status</TableHead>
                {user?.role === 'admin' && <TableHead>Employee</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {new Date(expense.expenseDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell className="capitalize">{expense.category}</TableCell>
                  <TableCell>
                    {expense.currency} {expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    ${expense.convertedAmount?.toFixed(2) || expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(expense.status)}</TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>{expense.employeeId?.email || 'N/A'}</TableCell>
                  )}
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No expenses found
                      {user?.role !== 'admin' && (
                        <>
                          {' - '}
                          <Link to="/expenses/new" className="text-primary hover:underline">
                            Submit your first expense
                          </Link>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
