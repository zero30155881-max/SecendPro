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
  FileText,
  Building,
  User,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Eye,
  Handshake
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

interface Contract {
  id: string
  unitId: string
  customerId: string
  startDate: string
  totalPrice: number
  discountAmount: number
  brokerName?: string
  brokerPercent: number
  brokerAmount: number
  commissionSafeId?: string
  downPaymentSafeId?: string
  maintenanceDeposit: number
  installmentType: string
  installmentCount: number
  extraAnnual: number
  annualPaymentValue: number
  downPayment: number
  paymentType: string
  unitCode: string
  unitName?: string
  unitType: string
  building?: string
  customerName: string
  customerPhone?: string
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

interface Customer {
  id: string
  name: string
  phone?: string
  nationalId?: string
}

interface ContractFormData {
  unitId: string
  customerId: string
  startDate: string
  totalPrice: number
  discountAmount: number
  brokerName: string
  brokerPercent: number
  brokerAmount: number
  commissionSafeId: string
  downPaymentSafeId: string
  maintenanceDeposit: number
  installmentType: string
  installmentCount: number
  extraAnnual: number
  annualPaymentValue: number
  downPayment: number
  paymentType: string
}

export function ContractsContent() {
  const [contracts, setContracts] = React.useState<Contract[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [safes, setSafes] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [unitFilter, setUnitFilter] = React.useState('')
  const [customerFilter, setCustomerFilter] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingContract, setEditingContract] = React.useState<Contract | null>(null)
  const [formData, setFormData] = React.useState<ContractFormData>({
    unitId: '',
    customerId: '',
    startDate: new Date().toISOString().split('T')[0],
    totalPrice: 0,
    discountAmount: 0,
    brokerName: '',
    brokerPercent: 0,
    brokerAmount: 0,
    commissionSafeId: '',
    downPaymentSafeId: '',
    maintenanceDeposit: 0,
    installmentType: 'شهري',
    installmentCount: 0,
    extraAnnual: 0,
    annualPaymentValue: 0,
    downPayment: 0,
    paymentType: 'installment'
  })

  // Fetch contracts
  const fetchContracts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (unitFilter) params.append('unitId', unitFilter)
      if (customerFilter) params.append('customerId', customerFilter)
      
      const response = await fetch(`/api/contracts?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setContracts(data.data.contracts)
      } else {
        toast.error(data.error || 'فشل في جلب بيانات العقود')
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
      toast.error('حدث خطأ في جلب بيانات العقود')
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

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      
      if (data.success) {
        setCustomers(data.data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  // Fetch safes
  const fetchSafes = async () => {
    try {
      const response = await fetch('/api/safes')
      const data = await response.json()
      
      if (data.success) {
        setSafes(data.data.safes)
      }
    } catch (error) {
      console.error('Error fetching safes:', error)
    }
  }

  // Create/Update contract
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/contracts'
      const method = editingContract ? 'PUT' : 'POST'
      const body = editingContract 
        ? { id: editingContract.id, ...formData }
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
        setEditingContract(null)
        resetForm()
        fetchContracts()
        fetchUnits() // Refresh units to update status
      } else {
        toast.error(data.error || 'فشل في حفظ العقد')
      }
    } catch (error) {
      console.error('Error saving contract:', error)
      toast.error('حدث خطأ في حفظ العقد')
    }
  }

  // Delete contract
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العقد؟')) return

    try {
      const response = await fetch(`/api/contracts?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchContracts()
        fetchUnits() // Refresh units to update status
      } else {
        toast.error(data.error || 'فشل في حذف العقد')
      }
    } catch (error) {
      console.error('Error deleting contract:', error)
      toast.error('حدث خطأ في حذف العقد')
    }
  }

  // Edit contract
  const handleEdit = (contract: Contract) => {
    setEditingContract(contract)
    setFormData({
      unitId: contract.unitId,
      customerId: contract.customerId,
      startDate: contract.startDate.split('T')[0],
      totalPrice: contract.totalPrice,
      discountAmount: contract.discountAmount,
      brokerName: contract.brokerName || '',
      brokerPercent: contract.brokerPercent,
      brokerAmount: contract.brokerAmount,
      commissionSafeId: contract.commissionSafeId || '',
      downPaymentSafeId: contract.downPaymentSafeId || '',
      maintenanceDeposit: contract.maintenanceDeposit,
      installmentType: contract.installmentType,
      installmentCount: contract.installmentCount,
      extraAnnual: contract.extraAnnual,
      annualPaymentValue: contract.annualPaymentValue,
      downPayment: contract.downPayment,
      paymentType: contract.paymentType
    })
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      unitId: '',
      customerId: '',
      startDate: new Date().toISOString().split('T')[0],
      totalPrice: 0,
      discountAmount: 0,
      brokerName: '',
      brokerPercent: 0,
      brokerAmount: 0,
      commissionSafeId: '',
      downPaymentSafeId: '',
      maintenanceDeposit: 0,
      installmentType: 'شهري',
      installmentCount: 0,
      extraAnnual: 0,
      annualPaymentValue: 0,
      downPayment: 0,
      paymentType: 'installment'
    })
  }

  // Open dialog for new contract
  const handleNewContract = () => {
    setEditingContract(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.brokerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUnit = !unitFilter || contract.unitId === unitFilter
    const matchesCustomer = !customerFilter || contract.customerId === customerFilter
    return matchesSearch && matchesUnit && matchesCustomer
  })

  // Calculate totals
  const totalValue = contracts.reduce((sum, c) => sum + c.totalPrice, 0)
  const totalDiscount = contracts.reduce((sum, c) => sum + c.discountAmount, 0)
  const totalBrokerAmount = contracts.reduce((sum, c) => sum + c.brokerAmount, 0)

  React.useEffect(() => {
    fetchContracts()
    fetchUnits()
    fetchCustomers()
    fetchSafes()
  }, [searchTerm, unitFilter, customerFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة العقود</h1>
          <p className="text-muted-foreground">
            إدارة عقود البيع والإيجار
          </p>
        </div>
        <Button onClick={handleNewContract}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة عقد جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العقود</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القيمة</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخصومات</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDiscount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عمولات السماسرة</CardTitle>
            <Handshake className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBrokerAmount)}</div>
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
                  placeholder="البحث بالسمسار أو كود الوحدة أو العميل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
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
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة بالعميل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع العملاء</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
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

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العقود</CardTitle>
          <CardDescription>
            عرض وإدارة جميع العقود في النظام
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
                  <TableHead>تاريخ البداية</TableHead>
                  <TableHead>القيمة الإجمالية</TableHead>
                  <TableHead>الخصم</TableHead>
                  <TableHead>السمسار</TableHead>
                  <TableHead>نوع الدفع</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <motion.tr
                    key={contract.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{contract.unitCode}</div>
                          <div className="text-sm text-muted-foreground">
                            {contract.unitName || 'غير محدد'} - {contract.building || 'غير محدد'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{contract.customerName}</div>
                          {contract.customerPhone && (
                            <div className="text-sm text-muted-foreground">
                              {contract.customerPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(contract.startDate)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(contract.totalPrice)}
                    </TableCell>
                    <TableCell>
                      {contract.discountAmount > 0 ? (
                        <span className="text-red-600">-{formatCurrency(contract.discountAmount)}</span>
                      ) : (
                        <span className="text-muted-foreground">لا يوجد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contract.brokerName ? (
                        <div>
                          <div className="font-medium">{contract.brokerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {contract.brokerPercent}% - {formatCurrency(contract.brokerAmount)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">لا يوجد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contract.paymentType === 'installment' ? 'أقساط' : 'نقدي'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(contract)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(contract.id)}
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

      {/* Add/Edit Contract Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? 'تعديل العقد' : 'إضافة عقد جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingContract 
                ? 'قم بتعديل بيانات العقد أدناه' 
                : 'أدخل بيانات العقد الجديد أدناه'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                    {units.filter(u => u.status === 'متاحة' || editingContract).map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.code} - {unit.name || 'غير محدد'} - {formatCurrency(unit.totalPrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerId">العميل *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.phone && `- ${customer.phone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">تاريخ البداية *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPrice">القيمة الإجمالية *</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: Number(e.target.value) })}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountAmount">مبلغ الخصم</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="downPayment">الدفعة المقدمة</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={formData.downPayment}
                  onChange={(e) => setFormData({ ...formData, downPayment: Number(e.target.value) })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brokerName">اسم السمسار</Label>
                <Input
                  id="brokerName"
                  value={formData.brokerName}
                  onChange={(e) => setFormData({ ...formData, brokerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brokerPercent">نسبة العمولة %</Label>
                <Input
                  id="brokerPercent"
                  type="number"
                  value={formData.brokerPercent}
                  onChange={(e) => setFormData({ ...formData, brokerPercent: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installmentType">نوع الأقساط</Label>
                <Select
                  value={formData.installmentType}
                  onValueChange={(value) => setFormData({ ...formData, installmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="شهري">شهري</SelectItem>
                    <SelectItem value="ربع سنوي">ربع سنوي</SelectItem>
                    <SelectItem value="نصف سنوي">نصف سنوي</SelectItem>
                    <SelectItem value="سنوي">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="installmentCount">عدد الأقساط</Label>
                <Input
                  id="installmentCount"
                  type="number"
                  value={formData.installmentCount}
                  onChange={(e) => setFormData({ ...formData, installmentCount: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentType">نوع الدفع</Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installment">أقساط</SelectItem>
                  <SelectItem value="cash">نقدي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {editingContract ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}