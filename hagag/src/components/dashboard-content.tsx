'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Building, 
  FileText, 
  Wallet,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  ArrowUpRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

// Mock data - سيتم استبدالها بالبيانات الحقيقية من API
const stats = {
  totalCustomers: 245,
  totalUnits: 180,
  totalContracts: 89,
  totalRevenue: 15750000,
  pendingInstallments: 23,
  totalSafes: 5,
  safeBalance: 2340000,
  monthlyRevenue: 890000,
}

const recentActivities = [
  {
    id: 1,
    type: 'contract',
    title: 'عقد جديد - أحمد محمد',
    description: 'وحدة A-101 - مبلغ 500,000 ريال',
    time: 'منذ ساعتين',
    icon: FileText,
    status: 'success'
  },
  {
    id: 2,
    type: 'payment',
    title: 'دفعة جديدة',
    description: 'قسط شهري - 25,000 ريال',
    time: 'منذ 4 ساعات',
    icon: Wallet,
    status: 'success'
  },
  {
    id: 3,
    type: 'installment',
    title: 'قسط متأخر',
    description: 'وحدة B-205 - استحقاق 15,000 ريال',
    time: 'منذ يوم',
    icon: AlertCircle,
    status: 'warning'
  },
]

const upcomingInstallments = [
  {
    id: 1,
    customer: 'سارة أحمد',
    unit: 'A-101',
    amount: 25000,
    dueDate: '2024-01-15',
    status: 'pending'
  },
  {
    id: 2,
    customer: 'محمد عبدالله',
    unit: 'B-205',
    amount: 30000,
    dueDate: '2024-01-18',
    status: 'pending'
  },
  {
    id: 3,
    customer: 'فاطمة علي',
    unit: 'C-301',
    amount: 20000,
    dueDate: '2024-01-20',
    status: 'pending'
  },
]

const statCards = [
  {
    title: 'إجمالي العملاء',
    value: stats.totalCustomers,
    icon: Users,
    trend: '+12%',
    trendUp: true,
    description: 'عميل مسجل'
  },
  {
    title: 'إجمالي الوحدات',
    value: stats.totalUnits,
    icon: Building,
    trend: '+5%',
    trendUp: true,
    description: 'وحدة متاحة'
  },
  {
    title: 'العقود النشطة',
    value: stats.totalContracts,
    icon: FileText,
    trend: '+8%',
    trendUp: true,
    description: 'عقد نشط'
  },
  {
    title: 'رصيد الخزائن',
    value: stats.safeBalance,
    icon: Wallet,
    trend: '+15%',
    trendUp: true,
    description: 'ريال سعودي',
    format: 'currency'
  },
]

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="text-muted-foreground">
            نظرة عامة على نشاط النظام والإحصائيات المالية
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            إضافة جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.format === 'currency' 
                    ? formatCurrency(stat.value) 
                    : stat.value.toLocaleString('ar-SA')
                  }
                </div>
                <div className="flex items-center space-x-1 space-x-reverse text-xs text-muted-foreground">
                  <Badge 
                    variant={stat.trendUp ? 'success' : 'destructive'} 
                    className="text-xs"
                  >
                    {stat.trend}
                  </Badge>
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>النشاطات الأخيرة</CardTitle>
              <CardDescription>
                آخر العمليات والمعاملات في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4 space-x-reverse"
                  >
                    <div className={`rounded-full p-2 ${
                      activity.status === 'success' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                        : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                    }`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Installments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                الأقساط القادمة
                <Badge variant="outline">{upcomingInstallments.length}</Badge>
              </CardTitle>
              <CardDescription>
                الأقساط المستحقة خلال الأسبوع القادم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingInstallments.map((installment) => (
                  <div
                    key={installment.id}
                    className="flex items-center justify-between space-x-4 space-x-reverse"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {installment.customer}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {installment.unit} - {new Date(installment.dueDate).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {formatCurrency(installment.amount)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        معلق
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                عرض جميع الأقساط
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
            <CardDescription>
              الوظائف الأكثر استخداماً في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Users className="h-6 w-6" />
                <span>إضافة عميل</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Building className="h-6 w-6" />
                <span>إضافة وحدة</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <FileText className="h-6 w-6" />
                <span>إنشاء عقد</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Wallet className="h-6 w-6" />
                <span>تسجيل دفعة</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}