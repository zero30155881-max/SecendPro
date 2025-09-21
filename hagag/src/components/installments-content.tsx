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
  Calendar,
  DollarSign,
  Building,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Download,
  Eye
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

interface Installment {
  id: string
  unitId: string
  amount: number
  dueDate: string
  status: string
  notes?: string
  unitCode: string
  unitName?: string
  building?: string
  customerName: string
  customerPhone?: string
  totalPrice: number
  discountAmount: number
  createdAt: string
  updatedAt: string
}

interface Unit {
  id: string
  code: string
  name?: string
  unitType: string
  building?: string
  totalPrice: number
  status: string
}

interface InstallmentFormData {
  unitId: string
  amount: number
  dueDate: string
  status: string
  notes: string
}

export function InstallmentsContent() {
  const [installments, setInstallments] = React.useState<Installment[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [unitFilter, setUnitFilter] = React.useState('')
  const [overdueFilter, setOverdueFilter] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingInstallment, setEditingInstallment] = React.useState<Installment | null>(null)
  const [formData, setFormData] = React.useState<InstallmentFormData>({
    unitId: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    status: 'معلق',
    notes: ''
  })

  // Fetch installments
  const fetchInstallments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (unitFilter) params.append('unitId', unitFilter)
      if (overdueFilter) params.append('overdue', 'true')
      
      const response = await fetch(`/api/installments?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setInstallments(data.data.installments)
      } else {
        toast.error(data.error || 'فشل في جلب بيانات الأقساط')
      }
    } catch (error) {
      console.error('Error fetching installments:', error)
      toast.error('حدث خطأ في جلب بيانات الأقساط')
    } finally {
      setLoading(false)
    }
  }

  // Fetch units
  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/units')
      const data = await response.json()
      
      if (data.success) {
        setUnits(data.data.units)
      }
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  // Create/Update installment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/installments'
      const method = editingInstallment ? 'PUT' : 'POST'
      const body = editingInstallment 
        ? { id: editingInstallment.id, ...formData }
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
        setEditingInstallment(null)
        resetForm()
        fetchInstallments()
      } else {
        toast.error(data.error || 'فشل في حفظ القسط')
      }
    } catch (error) {
      console.error('Error saving installment:', error)
      toast.error('حدث خطأ في حفظ القسط')
    }
  }

  // Delete installment
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسط؟')) return

    try {
      const response = await fetch(`/api/installments?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchInstallments()
      } else {
        toast.error(data.error || 'فشل في حذف القسط')
      }
    } catch (error) {
      console.error('Error deleting installment:', error)
      toast.error('حدث خطأ في حذف القسط')
    }
  }

  // Mark as paid
  const handleMarkAsPaid = async (id: string) => {
    try {
      const response = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'مدفوع' })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('تم تسجيل القسط كمدفوع')
        fetchInstallments()
      } else {
        toast.error(data.error || 'فشل في تحديث حالة القسط')
      }
    } catch (error) {
      console.error('Error updating installment status:', error)
      toast.error('حدث خطأ في تحديث حالة القسط')
    }
  }

  // Edit installment
  const handleEdit = (installment: Installment) => {
    setEditingInstallment(installment)
    setFormData({
      unitId: installment.unitId,
      amount: installment.amount,
      dueDate: installment.dueDate.split('T')[0],
      status: installment.status,
      notes: installment.notes || ''
    })
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      unitId: '',
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'معلق',
      notes: ''
    })
  }

  // Open dialog for new installment
  const handleNewInstallment = () => {
    setEditingInstallment(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Filter installments
  const filteredInstallments = installments.filter(installment => {
    const matchesSearch = installment.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         installment.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || installment.status === statusFilter
    const matchesUnit = !unitFilter || installment.unitId === unitFilter
    return matchesSearch && matchesStatus && matchesUnit
  })

  // Calculate totals
  const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0)
  const paidAmount = installments
    .filter(i => i.status === 'مدفوع')
    .reduce((sum, i) => sum + i.amount, 0)
  const pendingAmount = installments
    .filter(i => i.status === 'معلق')
    .reduce((sum, i) => sum + i.amount, 0)
  const overdueCount = installments.filter(i => {
    const dueDate = new Date(i.dueDate)
    const now = new Date()
    return i.status === 'معلق' && dueDate < now
  }).length

  React.useEffect(() => {
    fetchInstallments()
    fetchUnits()
  }, [searchTerm, statusFilter, unitFilter, overdueFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الأقساط</h1>
          <p className="text-muted-foreground">
            إدارة أقساط العقود والمتابعة المالية
          </p>
        </div>
        <Button onClick={handleNewInstallment}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة قسط جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأقساط</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{installments.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المدفوع</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المعلق</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المتأخر</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
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
                  placeholder="البحث بكود الوحدة أو اسم العميل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة بالحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الحالات</SelectItem>
                <SelectItem value="معلق">معلق</SelectItem>
                <SelectItem value="مدفوع">مدفوع</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة بالوحدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الوحدات</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name || 'غير محدد'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant={overdueFilter ? "default" : "outline"}
              onClick={() => setOverdueFilter(!overdueFilter)}
            >
              <AlertTriangle className="ml-2 h-4 w-4" />
              المتأخر فقط
            </Button>
            <Button variant="outline">
              <Download className="ml-2 h-4 w-4" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Installments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأقساط</CardTitle>
          <CardDescription>
            عرض وإدارة جميع أقساط العقود
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
                  <TableHead>الوحدة</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الملاحظات</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallments.map((installment) => {
                  const isOverdue = new Date(installment.dueDate) < new Date() && installment.status === 'معلق'
                  
                  return (
                    <motion.tr
                      key={installment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`hover:bg-muted/50 ${isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{installment.unitCode}</div>
                            <div className="text-sm text-muted-foreground">
                              {installment.unitName || 'غير محدد'} - {installment.building || 'غير محدد'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{installment.customerName}</div>
                            {installment.customerPhone && (
                              <div className="text-sm text-muted-foreground">
                                {installment.customerPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(installment.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {formatDate(installment.dueDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            installment.status === 'مدفوع' ? 'success' :
                            isOverdue ? 'destructive' : 'warning'
                          }
                        >
                          {installment.status}
                          {isOverdue && ' (متأخر)'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {installment.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {installment.status === 'معلق' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkAsPaid(installment.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(installment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(installment.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Installment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingInstallment ? 'تعديل القسط' : 'إضافة قسط جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingInstallment 
                ? 'قم بتعديل بيانات القسط أدناه' 
                : 'أدخل بيانات القسط الجديد أدناه'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitId">الوحدة *</Label>
              <Select
                value={formData.unitId}
                onValueChange={(value) => setFormData({ ...formData, unitId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.code} - {unit.name || 'غير محدد'} - {formatCurrency(unit.totalPrice)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Label htmlFor="dueDate">تاريخ الاستحقاق *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="معلق">معلق</SelectItem>
                  <SelectItem value="مدفوع">مدفوع</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {editingInstallment ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}