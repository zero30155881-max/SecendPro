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
  Users,
  Phone,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Handshake,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

interface Partner {
  id: string
  name: string
  phone?: string
  notes?: string
  totalDebt: number
  paidDebt: number
  pendingDebt: number
  debtCount: number
  createdAt: string
  updatedAt: string
}

interface PartnerFormData {
  name: string
  phone: string
  notes: string
}

export function PartnersContent() {
  const [partners, setPartners] = React.useState<Partner[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingPartner, setEditingPartner] = React.useState<Partner | null>(null)
  const [formData, setFormData] = React.useState<PartnerFormData>({
    name: '',
    phone: '',
    notes: ''
  })

  // Fetch partners
  const fetchPartners = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/partners?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setPartners(data.data.partners)
      } else {
        toast.error(data.error || 'فشل في جلب بيانات الشركاء')
      }
    } catch (error) {
      console.error('Error fetching partners:', error)
      toast.error('حدث خطأ في جلب بيانات الشركاء')
    } finally {
      setLoading(false)
    }
  }

  // Create/Update partner
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/partners'
      const method = editingPartner ? 'PUT' : 'POST'
      const body = editingPartner 
        ? { id: editingPartner.id, ...formData }
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
        setEditingPartner(null)
        resetForm()
        fetchPartners()
      } else {
        toast.error(data.error || 'فشل في حفظ الشريك')
      }
    } catch (error) {
      console.error('Error saving partner:', error)
      toast.error('حدث خطأ في حفظ الشريك')
    }
  }

  // Delete partner
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشريك؟')) return

    try {
      const response = await fetch(`/api/partners?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchPartners()
      } else {
        toast.error(data.error || 'فشل في حذف الشريك')
      }
    } catch (error) {
      console.error('Error deleting partner:', error)
      toast.error('حدث خطأ في حذف الشريك')
    }
  }

  // Edit partner
  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner)
    setFormData({
      name: partner.name,
      phone: partner.phone || '',
      notes: partner.notes || ''
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

  // Open dialog for new partner
  const handleNewPartner = () => {
    setEditingPartner(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Filter partners
  const filteredPartners = partners.filter(partner => 
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.phone?.includes(searchTerm) ||
    partner.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate totals
  const totalPartners = partners.length
  const totalDebt = partners.reduce((sum, p) => sum + p.totalDebt, 0)
  const totalPaidDebt = partners.reduce((sum, p) => sum + p.paidDebt, 0)
  const totalPendingDebt = partners.reduce((sum, p) => sum + p.pendingDebt, 0)

  React.useEffect(() => {
    fetchPartners()
  }, [searchTerm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الشركاء</h1>
          <p className="text-muted-foreground">
            إدارة الشركاء والمستحقات المالية
          </p>
        </div>
        <Button onClick={handleNewPartner}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة شريك جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشركاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPartners}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الديون</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDebt)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المدفوع</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaidDebt)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المعلق</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPendingDebt)}</div>
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

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الشركاء</CardTitle>
          <CardDescription>
            عرض وإدارة جميع الشركاء والمستحقات المالية
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
                  <TableHead>اسم الشريك</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>إجمالي الديون</TableHead>
                  <TableHead>المدفوع</TableHead>
                  <TableHead>المعلق</TableHead>
                  <TableHead>عدد الديون</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.map((partner) => (
                  <motion.tr
                    key={partner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Handshake className="h-4 w-4 text-muted-foreground" />
                        {partner.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {partner.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {partner.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-red-600" />
                        <span className="font-medium">{formatCurrency(partner.totalDebt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{formatCurrency(partner.paidDebt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-600">{formatCurrency(partner.pendingDebt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{partner.debtCount}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(partner.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(partner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(partner.id)}
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

      {/* Add/Edit Partner Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'تعديل الشريك' : 'إضافة شريك جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingPartner 
                ? 'قم بتعديل بيانات الشريك أدناه' 
                : 'أدخل بيانات الشريك الجديد أدناه'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الشريك *</Label>
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
                {editingPartner ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}