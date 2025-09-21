'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  ArrowUpDown
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

interface Safe {
  id: string
  name: string
  balance: number
  totalReceipts: number
  totalPayments: number
  voucherCount: number
  createdAt: string
  updatedAt: string
}

interface SafeFormData {
  name: string
  balance: number
}

export function SafesContent() {
  const [safes, setSafes] = React.useState<Safe[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingSafe, setEditingSafe] = React.useState<Safe | null>(null)
  const [formData, setFormData] = React.useState<SafeFormData>({
    name: '',
    balance: 0
  })

  // Fetch safes
  const fetchSafes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/safes?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setSafes(data.data.safes)
      } else {
        toast.error(data.error || 'فشل في جلب بيانات الخزائن')
      }
    } catch (error) {
      console.error('Error fetching safes:', error)
      toast.error('حدث خطأ في جلب بيانات الخزائن')
    } finally {
      setLoading(false)
    }
  }

  // Create/Update safe
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/safes'
      const method = editingSafe ? 'PUT' : 'POST'
      const body = editingSafe 
        ? { id: editingSafe.id, ...formData }
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
        setEditingSafe(null)
        resetForm()
        fetchSafes()
      } else {
        toast.error(data.error || 'فشل في حفظ الخزنة')
      }
    } catch (error) {
      console.error('Error saving safe:', error)
      toast.error('حدث خطأ في حفظ الخزنة')
    }
  }

  // Delete safe
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخزنة؟')) return

    try {
      const response = await fetch(`/api/safes?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchSafes()
      } else {
        toast.error(data.error || 'فشل في حذف الخزنة')
      }
    } catch (error) {
      console.error('Error deleting safe:', error)
      toast.error('حدث خطأ في حذف الخزنة')
    }
  }

  // Edit safe
  const handleEdit = (safe: Safe) => {
    setEditingSafe(safe)
    setFormData({
      name: safe.name,
      balance: safe.balance
    })
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      balance: 0
    })
  }

  // Open dialog for new safe
  const handleNewSafe = () => {
    setEditingSafe(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Filter safes
  const filteredSafes = safes.filter(safe => 
    safe.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate total balance
  const totalBalance = safes.reduce((sum, safe) => sum + safe.balance, 0)

  React.useEffect(() => {
    fetchSafes()
  }, [searchTerm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الخزائن</h1>
          <p className="text-muted-foreground">
            إدارة الخزائن والأرصدة المالية
          </p>
        </div>
        <Button onClick={handleNewSafe}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة خزنة جديدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخزائن</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرصدة</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيصالات</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(safes.reduce((sum, safe) => sum + safe.totalReceipts, 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(safes.reduce((sum, safe) => sum + safe.totalPayments, 0))}
            </div>
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
                  placeholder="البحث بالاسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Download className="ml-2 h-4 w-4" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Safes Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الخزائن</CardTitle>
          <CardDescription>
            عرض وإدارة جميع الخزائن والأرصدة المالية
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
                  <TableHead>اسم الخزنة</TableHead>
                  <TableHead>الرصيد الحالي</TableHead>
                  <TableHead>إجمالي الإيصالات</TableHead>
                  <TableHead>إجمالي المدفوعات</TableHead>
                  <TableHead>عدد السندات</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSafes.map((safe) => (
                  <motion.tr
                    key={safe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        {safe.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{formatCurrency(safe.balance)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        {formatCurrency(safe.totalReceipts)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        {formatCurrency(safe.totalPayments)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{safe.voucherCount}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(safe.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(safe)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(safe.id)}
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

      {/* Add/Edit Safe Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSafe ? 'تعديل الخزنة' : 'إضافة خزنة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingSafe 
                ? 'قم بتعديل بيانات الخزنة أدناه' 
                : 'أدخل بيانات الخزنة الجديدة أدناه'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الخزنة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">الرصيد الابتدائي</Label>
              <Input
                id="balance"
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {editingSafe ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}