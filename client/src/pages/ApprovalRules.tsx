import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Settings } from 'lucide-react';

export default function ApprovalRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'sequential',
    minAmount: '0',
    maxAmount: '',
    approvalPercentage: '60',
    specificApproverId: '',
    approvers: [] as { userId: string; step: number }[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesData, usersData] = await Promise.all([
        api.getApprovalRules(),
        api.getUsers(),
      ]);
      setRules(rulesData);
      setUsers(usersData.filter((u: any) => u.role === 'manager' || u.role === 'admin'));
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const ruleData: any = {
        name: formData.name,
        type: formData.type,
        minAmount: parseFloat(formData.minAmount),
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
        approvers: formData.approvers,
      };

      if (formData.type === 'percentage' || formData.type === 'hybrid') {
        ruleData.approvalPercentage = parseFloat(formData.approvalPercentage);
      }

      if (formData.type === 'specific_approver' || formData.type === 'hybrid') {
        ruleData.specificApproverId = formData.specificApproverId;
      }

      await api.createApprovalRule(ruleData);
      toast.success('Approval rule created successfully!');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create rule');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'sequential',
      minAmount: '0',
      maxAmount: '',
      approvalPercentage: '60',
      specificApproverId: '',
      approvers: [],
    });
  };

  const addApprover = () => {
    setFormData({
      ...formData,
      approvers: [
        ...formData.approvers,
        { userId: '', step: formData.approvers.length + 1 },
      ],
    });
  };

  const updateApprover = (index: number, userId: string) => {
    const updated = [...formData.approvers];
    updated[index].userId = userId;
    setFormData({ ...formData, approvers: updated });
  };

  const removeApprover = (index: number) => {
    const updated = formData.approvers.filter((_, i) => i !== index);
    setFormData({ ...formData, approvers: updated });
  };

  const getRuleTypeBadge = (type: string) => {
    const colors: any = {
      sequential: 'bg-primary text-primary-foreground',
      percentage: 'bg-accent text-accent-foreground',
      specific_approver: 'bg-success text-success-foreground',
      hybrid: 'bg-warning text-warning-foreground',
    };
    return <Badge className={colors[type] || 'default'}>{type.replace('_', ' ')}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approval Rules</h1>
          <p className="text-muted-foreground">Configure expense approval workflows and thresholds</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <CardDescription>
                    Amount range: ${rule.minAmount} - ${rule.maxAmount || '∞'}
                  </CardDescription>
                </div>
                {getRuleTypeBadge(rule.type)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rule.type === 'sequential' && (
                  <p className="text-sm text-muted-foreground">
                    Sequential approval through {rule.approvers?.length || 0} steps
                  </p>
                )}
                {(rule.type === 'percentage' || rule.type === 'hybrid') && (
                  <p className="text-sm text-muted-foreground">
                    Requires {rule.approvalPercentage}% approval
                  </p>
                )}
                {(rule.type === 'specific_approver' || rule.type === 'hybrid') && (
                  <p className="text-sm text-muted-foreground">
                    Specific approver can override
                  </p>
                )}
                <div className="flex gap-2 flex-wrap pt-2">
                  {rule.approvers?.map((approver: any, idx: number) => (
                    <Badge key={idx} variant="outline">
                      Step {approver.step}: {approver.user?.email || 'Unknown'}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No approval rules configured</p>
              <Button variant="outline" onClick={() => setDialogOpen(true)} className="mt-4">
                Create First Rule
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Approval Rule</DialogTitle>
            <DialogDescription>
              Configure a new expense approval workflow
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Multi-Level Approval"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Rule Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">Sequential (Step-by-step)</SelectItem>
                  <SelectItem value="percentage">Percentage (% of approvers)</SelectItem>
                  <SelectItem value="specific_approver">Specific Approver</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Percentage OR Specific)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Min Amount ($)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Amount ($)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  step="0.01"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            {(formData.type === 'percentage' || formData.type === 'hybrid') && (
              <div className="space-y-2">
                <Label htmlFor="approvalPercentage">Approval Percentage (%)</Label>
                <Input
                  id="approvalPercentage"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.approvalPercentage}
                  onChange={(e) => setFormData({ ...formData, approvalPercentage: e.target.value })}
                  required
                />
              </div>
            )}

            {(formData.type === 'specific_approver' || formData.type === 'hybrid') && (
              <div className="space-y-2">
                <Label htmlFor="specificApproverId">Specific Approver</Label>
                <Select
                  value={formData.specificApproverId}
                  onValueChange={(v) => setFormData({ ...formData, specificApproverId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Approvers</Label>
                <Button type="button" variant="outline" size="sm" onClick={addApprover}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Approver
                </Button>
              </div>
              <div className="space-y-2">
                {formData.approvers.map((approver, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        value={approver.userId}
                        onValueChange={(v) => updateApprover(index, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Step ${approver.step} - Select approver`} />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.email} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeApprover(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Rule
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
