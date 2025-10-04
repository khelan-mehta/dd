import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Approvals() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      const data = await api.getPendingApprovals();
      setApprovals(data);
    } catch (error) {
      console.error('Failed to load approvals', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (status: 'approved' | 'rejected') => {
    if (!selectedApproval) return;

    setProcessing(true);
    try {
      await api.processApproval(selectedApproval.id, status, comments);
      toast.success(`Expense ${status} successfully!`);
      setSelectedApproval(null);
      setComments('');
      loadApprovals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading approvals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground">Review and approve expense reimbursement requests</p>
      </div>

      <div className="grid gap-4">
        {approvals.map((approval) => (
          <Card key={approval.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {approval.expense?.description || 'Expense'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Submitted by {approval.expense?.user?.email || 'Unknown'}
                  </p>
                </div>
                <Badge variant="secondary">Step {approval.step}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold">
                      {approval.expense?.currency} {approval.expense?.amount?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Converted Amount</p>
                    <p className="font-semibold">
                      ${approval.expense?.convertedAmount?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-semibold capitalize">{approval.expense?.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {approval.expense?.expenseDate ? 
                        new Date(approval.expense.expenseDate).toLocaleDateString() : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>

                {approval.expense?.merchantName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Merchant</p>
                    <p className="font-medium">{approval.expense.merchantName}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setSelectedApproval(approval)}
                    className="bg-success text-success-foreground hover:bg-success/90"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedApproval(approval);
                      setComments('');
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {approvals.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No pending approvals</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Expense</DialogTitle>
            <DialogDescription>
              Add optional comments about this expense approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any notes or feedback..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleProcess('approved')}
                disabled={processing}
                className="flex-1 bg-success text-success-foreground hover:bg-success/90"
              >
                {processing ? 'Processing...' : 'Approve'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleProcess('rejected')}
                disabled={processing}
                className="flex-1"
              >
                {processing ? 'Processing...' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
