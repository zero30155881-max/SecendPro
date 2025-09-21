'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Building, 
  User, 
  Bell, 
  Shield, 
  Database,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/components/ui/toaster'

interface CompanySettings {
  name: string
  address: string
  phone: string
  email: string
  website: string
  logo: string
  description: string
}

interface UserSettings {
  name: string
  email: string
  phone: string
  language: string
  timezone: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

interface SystemSettings {
  maintenanceMode: boolean
  autoBackup: boolean
  backupFrequency: string
  dataRetention: string
  currency: string
  dateFormat: string
}

export function SettingsContent() {
  const [activeTab, setActiveTab] = React.useState('company')
  const [loading, setLoading] = React.useState(false)
  
  const [companySettings, setCompanySettings] = React.useState<CompanySettings>({
    name: 'شركة إدارة العقارات',
    address: 'الرياض، المملكة العربية السعودية',
    phone: '+966 50 123 4567',
    email: 'info@estate.com',
    website: 'www.estate.com',
    logo: '',
    description: 'نظام إدارة العقارات المتطور'
  })

  const [userSettings, setUserSettings] = React.useState<UserSettings>({
    name: 'مدير النظام',
    email: 'admin@estate.com',
    phone: '+966 50 123 4567',
    language: 'ar',
    timezone: 'Asia/Riyadh',
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  })

  const [systemSettings, setSystemSettings] = React.useState<SystemSettings>({
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '2years',
    currency: 'SAR',
    dateFormat: 'DD/MM/YYYY'
  })

  const handleSave = async (section: string) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`تم حفظ إعدادات ${section} بنجاح`)
    } catch (error) {
      toast.error('حدث خطأ في حفظ الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  const handleBackup = async () => {
    setLoading(true)
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('تم إنشاء نسخة احتياطية بنجاح')
    } catch (error) {
      toast.error('حدث خطأ في إنشاء النسخة الاحتياطية')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
      return
    }
    
    setLoading(true)
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('تم استعادة النسخة الاحتياطية بنجاح')
    } catch (error) {
      toast.error('حدث خطأ في استعادة النسخة الاحتياطية')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'company', label: 'إعدادات الشركة', icon: Building },
    { id: 'user', label: 'إعدادات المستخدم', icon: User },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'system', label: 'إعدادات النظام', icon: Settings },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: Database }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground">
          إدارة إعدادات النظام والشركة والمستخدم
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>الأقسام</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="ml-2 h-4 w-4" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Company Settings */}
          {activeTab === 'company' && (
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الشركة</CardTitle>
                <CardDescription>
                  إدارة معلومات الشركة والبيانات الأساسية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">اسم الشركة</Label>
                    <Input
                      id="companyName"
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">رقم الهاتف</Label>
                    <Input
                      id="companyPhone"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">العنوان</Label>
                  <Textarea
                    id="companyAddress"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">البريد الإلكتروني</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">الموقع الإلكتروني</Label>
                    <Input
                      id="companyWebsite"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyDescription">وصف الشركة</Label>
                  <Textarea
                    id="companyDescription"
                    value={companySettings.description}
                    onChange={(e) => setCompanySettings({ ...companySettings, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button onClick={() => handleSave('الشركة')} disabled={loading}>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ إعدادات الشركة
                </Button>
              </CardContent>
            </Card>
          )}

          {/* User Settings */}
          {activeTab === 'user' && (
            <Card>
              <CardHeader>
                <CardTitle>إعدادات المستخدم</CardTitle>
                <CardDescription>
                  إدارة معلومات المستخدم الشخصية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="userName">الاسم</Label>
                    <Input
                      id="userName"
                      value={userSettings.name}
                      onChange={(e) => setUserSettings({ ...userSettings, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">البريد الإلكتروني</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={userSettings.email}
                      onChange={(e) => setUserSettings({ ...userSettings, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userPhone">رقم الهاتف</Label>
                  <Input
                    id="userPhone"
                    value={userSettings.phone}
                    onChange={(e) => setUserSettings({ ...userSettings, phone: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">اللغة</Label>
                    <Select
                      value={userSettings.language}
                      onValueChange={(value) => setUserSettings({ ...userSettings, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">المنطقة الزمنية</Label>
                    <Select
                      value={userSettings.timezone}
                      onValueChange={(value) => setUserSettings({ ...userSettings, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                        <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                        <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={() => handleSave('المستخدم')} disabled={loading}>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ إعدادات المستخدم
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الإشعارات</CardTitle>
                <CardDescription>
                  إدارة تفضيلات الإشعارات والتنبيهات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>الإشعارات عبر البريد الإلكتروني</Label>
                      <p className="text-sm text-muted-foreground">
                        تلقي إشعارات عبر البريد الإلكتروني
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.email}
                      onCheckedChange={(checked) => 
                        setUserSettings({ 
                          ...userSettings, 
                          notifications: { ...userSettings.notifications, email: checked }
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>الإشعارات عبر الرسائل النصية</Label>
                      <p className="text-sm text-muted-foreground">
                        تلقي إشعارات عبر الرسائل النصية
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.sms}
                      onCheckedChange={(checked) => 
                        setUserSettings({ 
                          ...userSettings, 
                          notifications: { ...userSettings.notifications, sms: checked }
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>الإشعارات الفورية</Label>
                      <p className="text-sm text-muted-foreground">
                        تلقي إشعارات فورية في المتصفح
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.push}
                      onCheckedChange={(checked) => 
                        setUserSettings({ 
                          ...userSettings, 
                          notifications: { ...userSettings.notifications, push: checked }
                        })
                      }
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('الإشعارات')} disabled={loading}>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ إعدادات الإشعارات
                </Button>
              </CardContent>
            </Card>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام</CardTitle>
                <CardDescription>
                  إدارة إعدادات النظام المتقدمة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>وضع الصيانة</Label>
                      <p className="text-sm text-muted-foreground">
                        إيقاف النظام مؤقتاً للصيانة
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => 
                        setSystemSettings({ ...systemSettings, maintenanceMode: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>النسخ الاحتياطي التلقائي</Label>
                      <p className="text-sm text-muted-foreground">
                        إنشاء نسخ احتياطية تلقائية
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.autoBackup}
                      onCheckedChange={(checked) => 
                        setSystemSettings({ ...systemSettings, autoBackup: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">تكرار النسخ الاحتياطية</Label>
                      <Select
                        value={systemSettings.backupFrequency}
                        onValueChange={(value) => setSystemSettings({ ...systemSettings, backupFrequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">يومي</SelectItem>
                          <SelectItem value="weekly">أسبوعي</SelectItem>
                          <SelectItem value="monthly">شهري</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">العملة</Label>
                      <Select
                        value={systemSettings.currency}
                        onValueChange={(value) => setSystemSettings({ ...systemSettings, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                          <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                          <SelectItem value="EUR">يورو (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSave('النظام')} disabled={loading}>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ إعدادات النظام
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>النسخ الاحتياطي</CardTitle>
                  <CardDescription>
                    إدارة النسخ الاحتياطية واستعادة البيانات
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button onClick={handleBackup} disabled={loading}>
                      <Download className="ml-2 h-4 w-4" />
                      إنشاء نسخة احتياطية
                    </Button>
                    <Button variant="outline" onClick={handleRestore} disabled={loading}>
                      <Upload className="ml-2 h-4 w-4" />
                      استعادة نسخة احتياطية
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    آخر نسخة احتياطية: 2024-01-15 14:30
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات قاعدة البيانات</CardTitle>
                  <CardDescription>
                    معلومات عن حجم البيانات والأداء
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>حجم قاعدة البيانات</Label>
                      <div className="text-2xl font-bold">2.5 GB</div>
                    </div>
                    <div className="space-y-2">
                      <Label>عدد السجلات</Label>
                      <div className="text-2xl font-bold">15,420</div>
                    </div>
                    <div className="space-y-2">
                      <Label>آخر تحديث</Label>
                      <div className="text-sm text-muted-foreground">منذ 5 دقائق</div>
                    </div>
                    <div className="space-y-2">
                      <Label>حالة الاتصال</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">متصل</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}