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
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Home,
  Building2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

interface Unit {
  id: string
  code: string
  name?: string
  unitType: string
  area?: string
  floor?: string
  building?: string
  totalPrice: number
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface UnitFormData {
  code: string
  name: string
  unitType: string
  area: string
  floor: string
  building: string
  totalPrice: number
  status: string
  notes: string
}

export function UnitsContent() {
  const [units, setUnits] = React.useState<Unit[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingUnit, setEditingUnit] = React.useState<Unit | null>(null)
  const [formData, setFormData] = React.useState<UnitFormData>({
    code: '',
    name: '',
    unitType: 'سكني',
    area: '',
    floor: '',
    building: '',
    totalPrice: 0,
    status: 'متاحة',
    notes: ''
  })

  // Fetch units
  const fetchUnits = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('unitType', typeFilter)
      
      const response = await fetch(`/api/units?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setUnits(data.data.units)
      } else {
        toast.error(data.error || 'فشل في جلب بيانات الوحدات')
      }
    } catch (error) {
      console.error('Error fetching units:', error)
      toast.error('حدث خطأ في جلب بيانات الوحدات')
    } finally {
      setLoading(false)
    }
  }

  // Create/Update unit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/units'
      const method = editingUnit ? 'PUT' : 'POST'
      const body = editingUnit 
        ? { id: editingUnit.id, ...formData }
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
        setEditingUnit(null)
        resetForm()
        fetchUnits()
      } else {
        toast.error(data.error || 'فشل في حفظ الوحدة')
      }
    } catch (error) {
      console.error('Error saving unit:', error)
      toast.error('حدث خطأ في حفظ الوحدة')
    }
  }

  // Delete unit
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return

    try {
      const response = await fetch(`/api/units?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchUnits()
      } else {
        toast.error(data.error || 'فشل في حذف الوحدة')
      }
    } catch (error) {
      console.error('Error deleting unit:', error)
      toast.error('حدث خطأ في حذف الوحدة')
    }
  }

  // Edit unit
  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit)
    setFormData({
      code: unit.code,
      name: unit.name || '',
      unitType: unit.unitType,
      area: unit.area || '',
      floor: unit.floor || '',
      building: unit.building || '',
      totalPrice: unit.totalPrice,
      status: unit.status,
      notes: unit.notes || ''
    })
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      unitType: 'سكني',
      area: '',
      floor: '',
      building: '',
      totalPrice: 0,
      status: 'متاحة',
      notes: ''
    })
  }

  // Open dialog for new unit
  const handleNewUnit = () => {
    setEditingUnit(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Filter units
  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.building?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || unit.status === statusFilter
    const matchesType = !typeFilter || unit.unitType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  React.useEffect(() => {
    fetchUnits()
  }, [searchTerm, statusFilter, typeFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الوحدات</h1>
          <p className="text-muted-foreground">
            إدارة الوحدات العقارية والمعلومات التفصيلية
          </p>
        </div>
        <Button onClick={handleNewUnit}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة وحدة جديدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الوحدات</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متاحة</CardTitle>
            <Badge variant="success" className="w-fit">متاحة</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {units.filter(u => u.status === 'متاحة').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">محجوزة</CardTitle>
            <Badge variant="warning" className="w-fit">محجوزة</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {units.filter(u => u.status === 'محجوزة').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مباعة</CardTitle>
            <Badge variant="destructive" className="w-fit">مباعة</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {units.filter(u => u.status === 'مباعة').length}
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
                  placeholder="البحث بالكود أو الاسم أو المبنى..."
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
                <SelectItem value="متاحة">متاحة</SelectItem>
                <SelectItem value="محجوزة">محجوزة</SelectItem>
                <SelectItem value="مباعة">مباعة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة بالنوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الأنواع</SelectItem>
                <SelectItem value="سكني">سكني</SelectItem>
                <SelectItem value="تجاري">تجاري</SelectItem>
                <SelectItem value="مكتبي">مكتبي</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="ml-2 h-4 w-4" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Units Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الوحدات</CardTitle>
          <CardDescription>
            عرض وإدارة جميع الوحدات العقارية في النظام
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
                  <TableHead>الكود</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المساحة</TableHead>
                  <TableHead>الطابق</TableHead>
                  <TableHead>المبنى</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit) => (
                  <motion.tr
                    key={unit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{unit.code}</TableCell>
                    <TableCell>{unit.name || 'غير محدد'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {unit.unitType === 'سكني' ? (
                          <Home className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Building2 className="h-4 w-4 text-green-600" />
                        )}
                        {unit.unitType}
                      </div>
                    </TableCell>
                    <TableCell>{unit.area || 'غير محدد'}</TableCell>
                    <TableCell>{unit.floor || 'غير محدد'}</TableCell>
                    <TableCell>{unit.building || 'غير محدد'}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(unit.totalPrice)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          unit.status === 'متاحة' ? 'success' :
                          unit.status === 'محجوزة' ? 'warning' : 'destructive'
                        }
                      >
                        {unit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(unit)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(unit.id)}
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

      {/* Add/Edit Unit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingUnit 
                ? 'قم بتعديل بيانات الوحدة أدناه' 
                : 'أدخل بيانات الوحدة الجديدة أدناه'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">كود الوحدة *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">اسم الوحدة</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitType">نوع الوحدة</Label>
                <Select
                  value={formData.unitType}
                  onValueChange={(value) => setFormData({ ...formData, unitType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="سكني">سكني</SelectItem>
                    <SelectItem value="تجاري">تجاري</SelectItem>
                    <SelectItem value="مكتبي">مكتبي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">المساحة</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="متر مربع"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">الطابق</Label>
                <Input
                  id="floor"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building">المبنى</Label>
                <Input
                  id="building"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                />
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
                    <SelectItem value="متاحة">متاحة</SelectItem>
                    <SelectItem value="محجوزة">محجوزة</SelectItem>
                    <SelectItem value="مباعة">مباعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrice">السعر الإجمالي</Label>
              <Input
                id="totalPrice"
                type="number"
                value={formData.totalPrice}
                onChange={(e) => setFormData({ ...formData, totalPrice: Number(e.target.value) })}
                placeholder="0.00"
                min="0"
                step="0.01"
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
                {editingUnit ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}