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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck,
  Phone,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Handshake,
  TrendingUp,
  TrendingDown,
  Percent
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

interface Broker {
  id: string
  name: string
  phone?: string
  notes?: string
  totalDues: number
  paidDues: number
  pendingDues: number
  duesCount: number
  createdAt: string
  updatedAt: string
}

interface BrokerFormData {
  name: string
  phone: string
  notes: string
}

export function BrokersContent() {
  const [brokers, setBrokers] = React.useState<Broker[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingBroker, setEditingBroker] = React.useState<Broker | null>(null)
  const [formData, setFormData] = React.useState<BrokerFormData>({
    name: '',
    phone: '',
    notes: ''
  })

  // Fetch brokers
  const fetchBrokers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/brokers?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setBrokers(data.data.brokers)
      } else {
        toast.error(data.error || 'فشل في جلب بيانات السماسرة')
      }
    } catch (error) {
      console.error('Error fetching brokers:', error)
      toast.error('حدث خطأ في جلب بيانات السماسرة')
    } finally {
      setLoading(false)
    }
  }

  // Create/Update broker
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/brokers'
      const method = editingBroker ? 'PUT' : 'POST'
      const body = editingBroker 
        ? { id: editingBroker.id, ...formData }
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
        setEditingBroker(null)
        resetForm()
        fetchBrokers()
      } else {
        toast.error(data.error || 'فشل في حفظ السمسار')
      }
    } catch (error) {
      console.error('Error saving broker:', error)
      toast.error('حدث خطأ في حفظ السمسار')
    }
  }

  // Delete broker
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السمسار؟')) return

    try {
      const response = await fetch(`/api/brokers?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchBrokers()
      } else {
        toast.error(data.error || 'فشل في حذف السمسار')
      }
    } catch (error) {
      console.error('Error deleting broker:', error)
      toast.error('حدث خطأ في حذف السمسار')
    }
  }

  // Edit broker
  const handleEdit = (broker: Broker) => {
    setEditingBroker(broker)
    setFormData({
      name: broker.name,
      phone: broker.phone || '',
      notes: broker.notes || ''
    })
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      notes: ''
    })
  }

  // Open dialog for new broker
  const handleNewBroker = () => {
    setEditingBroker(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Filter brokers
  const filteredBrokers = brokers.filter(broker => 
    broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.phone?.includes(searchTerm) ||
    broker.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate totals
  const totalBrokers = brokers.length
  const totalDues = brokers.reduce((sum, b) => sum + b.totalDues, 0)
  const totalPaidDues = brokers.reduce((sum, b) => sum + b.paidDues, 0)
  const totalPendingDues = brokers.reduce((sum, b) => sum + b.pendingDues, 0)

  React.useEffect(() => {
    fetchBrokers()
  }, [searchTerm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة السماسرة</h1>
          <p className="text-muted-foreground">
            إدارة السماسرة والمستحقات المالية
          </p>
        </div>
        <Button onClick={handleNewBroker}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة سمسار جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السماسرة</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBrokers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستحقات</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDues)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المدفوع</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaidDues)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المعلق</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPendingDues)}</div>
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
                  placeholder="البحث بالاسم أو الهاتف أو الملاحظات..."
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

      {/* Brokers Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة السماسرة</CardTitle>
          <CardDescription>
            عرض وإدارة جميع السماسرة والمستحقات المالية
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
                  <TableHead>اسم السمسار</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>إجمالي المستحقات</TableHead>
                  <TableHead>المدفوع</TableHead>
                  <TableHead>المعلق</TableHead>
                  <TableHead>عدد المستحقات</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrokers.map((broker) => (
                  <motion.tr
                    key={broker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        {broker.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {broker.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {broker.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{formatCurrency(broker.totalDues)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{formatCurrency(broker.paidDues)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-600">{formatCurrency(broker.pendingDues)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{broker.duesCount}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(broker.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(broker)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(broker.id)}
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

      {/* Add/Edit Broker Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingBroker ? 'تعديل السمسار' : 'إضافة سمسار جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingBroker 
                ? 'قم بتعديل بيانات السمسار أدناه' 
                : 'أدخل بيانات السمسار الجديد أدناه'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم السمسار *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
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
                {editingBroker ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}