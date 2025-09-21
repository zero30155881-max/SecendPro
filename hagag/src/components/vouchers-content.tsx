'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Receipt,
  CreditCard,
  DollarSign,
  Calendar,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

interface Voucher {
  id: string
  type: string
  date: string
  amount: number
  safeId: string
  description: string
  payer?: string
  beneficiary?: string
  linkedRef?: string
  safeName: string
  createdAt: string
  updatedAt: string
}

interface Safe {
  id: string
  name: string
  balance: number
}

interface VoucherFormData {
  type: string
  date: string
  amount: number
  safeId: string
  description: string
  payer: string
  beneficiary: string
  linkedRef: string
}

export function VouchersContent() {
  const [vouchers, setVouchers] = React.useState<Voucher[]>([])
  const [safes, setSafes] = React.useState<Safe[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState('')
  const [safeFilter, setSafeFilter] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingVoucher, setEditingVoucher] = React.useState<Voucher | null>(null)
  const [formData, setFormData] = React.useState<VoucherFormData>({
    type: 'receipt',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    safeId: '',
    description: '',
    payer: '',
    beneficiary: '',
    linkedRef: ''
  })

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter) params.append('type', typeFilter)
      if (safeFilter) params.append('safeId', safeFilter)
      
      const response = await fetch(`/api/vouchers?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setVouchers(data.data.vouchers)
      } else {
        toast.error(data.error || 'فشل في جلب بيانات السندات')
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error)
      toast.error('حدث خطأ في جلب بيانات السندات')
    } finally {
      setLoading(false)
    }
  }

  // Fetch safes
  const fetchSafes = async () => {
    try {
      const response = await fetch('/api/safes')
      const data = await response.json()
      
      if (data.success) {
        setSafes(data.data.safes)
        if (data.data.safes.length > 0 && !formData.safeId) {
          setFormData(prev => ({ ...prev, safeId: data.data.safes[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching safes:', error)
    }
  }

  // Create/Update voucher
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/vouchers'
      const method = editingVoucher ? 'PUT' : 'POST'
      const body = editingVoucher 
        ? { id: editingVoucher.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setIsDialogOpen(false)
        setEditingVoucher(null)
        resetForm()
        fetchVouchers()
        fetchSafes() // Refresh safes to update balances
      } else {
        toast.error(data.error || 'فشل في حفظ السند')
      }
    } catch (error) {
      console.error('Error saving voucher:', error)
      toast.error('حدث خطأ في حفظ السند')
    }
  }

  // Delete voucher
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السند؟')) return

    try {
      const response = await fetch(`/api/vouchers?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchVouchers()
        fetchSafes() // Refresh safes to update balances
      } else {
        toast.error(data.error || 'فشل في حذف السند')
      }
    } catch (error) {
      console.error('Error deleting voucher:', error)
      toast.error('حدث خطأ في حذف السند')
    }
  }

  // Edit voucher
  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher)
    setFormData({
      type: voucher.type,
      date: voucher.date.split('T')[0],
      amount: voucher.amount,
      safeId: voucher.safeId,
      description: voucher.description,
      payer: voucher.payer || '',
      beneficiary: voucher.beneficiary || '',
      linkedRef: voucher.linkedRef || ''
    })
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'receipt',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      safeId: safes.length > 0 ? safes[0].id : '',
      description: '',
      payer: '',
      beneficiary: '',
      linkedRef: ''
    })
  }

  // Open dialog for new voucher
  const handleNewVoucher = () => {
    setEditingVoucher(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Filter vouchers
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.payer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.beneficiary?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || voucher.type === typeFilter
    const matchesSafe = !safeFilter || voucher.safeId === safeFilter
    return matchesSearch && matchesType && matchesSafe
  })

  // Calculate totals
  const totalReceipts = vouchers
    .filter(v => v.type === 'receipt')
    .reduce((sum, v) => sum + v.amount, 0)
  
  const totalPayments = vouchers
    .filter(v => v.type === 'payment')
    .reduce((sum, v) => sum + v.amount, 0)

  React.useEffect(() => {
    fetchVouchers()
    fetchSafes()
  }, [searchTerm, typeFilter, safeFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة السندات</h1>
          <p className="text-muted-foreground">
            إدارة إيصالات القبض وسندات الدفع
          </p>
        </div>
        <Button onClick={handleNewVoucher}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة سند جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السندات</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vouchers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيصالات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReceipts)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayments)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReceipts - totalPayments)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والفلترة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="البحث بالوصف أو الدافع أو المستفيد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة بالنوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الأنواع</SelectItem>
                <SelectItem value="receipt">إيصال قبض</SelectItem>
                <SelectItem value="payment">سند دفع</SelectItem>
              </SelectContent>
            </Select>
            <Select value={safeFilter} onValueChange={setSafeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة بالخزنة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الخزائن</SelectItem>
                {safes.map(safe => (
                  <SelectItem key={safe.id} value={safe.id}>{safe.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="ml-2 h-4 w-4" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة السندات</CardTitle>
          <CardDescription>
            عرض وإدارة جميع السندات المالية
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الخزنة</TableHead>
                  <TableHead>الدافع/المستفيد</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map((voucher) => (
                  <motion.tr
                    key={voucher.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {voucher.type === 'receipt' ? (
                          <Receipt className="h-4 w-4 text-green-600" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={voucher.type === 'receipt' ? 'success' : 'destructive'}>
                          {voucher.type === 'receipt' ? 'إيصال قبض' : 'سند دفع'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(voucher.date)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(voucher.amount)}
                    </TableCell>
                    <TableCell className="max-w-48 truncate">
                      {voucher.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        {voucher.safeName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {voucher.type === 'receipt' ? voucher.payer : voucher.beneficiary}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(voucher)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(voucher.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Voucher Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingVoucher ? 'تعديل السند' : 'إضافة سند جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingVoucher 
                ? 'قم بتعديل بيانات السند أدناه' 
                : 'أدخل بيانات السند الجديد أدناه'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">نوع السند *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">إيصال قبض</SelectItem>
                    <SelectItem value="payment">سند دفع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">التاريخ *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">المبلغ *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="safeId">الخزنة *</Label>
                <Select
                  value={formData.safeId}
                  onValueChange={(value) => setFormData({ ...formData, safeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الخزنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {safes.map(safe => (
                      <SelectItem key={safe.id} value={safe.id}>
                        {safe.name} - {formatCurrency(safe.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payer">الدافع</Label>
                <Input
                  id="payer"
                  value={formData.payer}
                  onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                  placeholder="اسم الدافع"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiary">المستفيد</Label>
                <Input
                  id="beneficiary"
                  value={formData.beneficiary}
                  onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                  placeholder="اسم المستفيد"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedRef">المرجع المرتبط</Label>
              <Input
                id="linkedRef"
                value={formData.linkedRef}
                onChange={(e) => setFormData({ ...formData, linkedRef: e.target.value })}
                placeholder="رقم العقد أو الوحدة"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {editingVoucher ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}