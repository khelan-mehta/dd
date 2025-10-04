import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, Camera } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food & Meals' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'];

export default function SubmitExpense() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    merchantName: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const result = await api.uploadReceipt(file);
      
      // Auto-fill form with OCR data
      if (result.amount) handleChange('amount', result.amount.toString());
      if (result.currency) handleChange('currency', result.currency);
      if (result.category) handleChange('category', result.category);
      if (result.description) handleChange('description', result.description);
      if (result.date) handleChange('expenseDate', result.date);
      if (result.merchantName) handleChange('merchantName', result.merchantName);
      
      toast.success('Receipt scanned successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to scan receipt');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.submitExpense({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('Expense submitted successfully!');
      navigate('/expenses');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Submit Expense</h1>
        <p className="text-muted-foreground">Create a new expense reimbursement request</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receipt Scan (OCR)</CardTitle>
          <CardDescription>Upload a receipt to auto-fill expense details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <label className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={ocrLoading}
                asChild
              >
                <span>
                  {ocrLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Receipt
                    </>
                  )}
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={ocrLoading}
              />
            </label>
            <label className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={ocrLoading}
                asChild
              >
                <span>
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
                disabled={ocrLoading}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(curr => (
                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="e.g., Team lunch with clients"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Date *</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => handleChange('expenseDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchantName">Merchant Name</Label>
                <Input
                  id="merchantName"
                  value={formData.merchantName}
                  onChange={(e) => handleChange('merchantName', e.target.value)}
                  placeholder="e.g., Restaurant Name"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Submitting...' : 'Submit Expense'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/expenses')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
