'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Users,
  Building,
  UserCheck,
  FileText,
  Calendar,
  Wallet,
  Receipt,
  Handshake,
  BarChart3,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  {
    name: 'لوحة التحكم',
    href: '/',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'العملاء',
    href: '/customers',
    icon: Users,
    badge: null,
  },
  {
    name: 'الوحدات',
    href: '/units',
    icon: Building,
    badge: null,
  },
  {
    name: 'الشركاء',
    href: '/partners',
    icon: UserCheck,
    badge: null,
  },
  {
    name: 'العقود',
    href: '/contracts',
    icon: FileText,
    badge: null,
  },
  {
    name: 'الأقساط',
    href: '/installments',
    icon: Calendar,
    badge: 'جديد',
  },
  {
    name: 'الخزائن',
    href: '/safes',
    icon: Wallet,
    badge: null,
  },
  {
    name: 'السندات',
    href: '/vouchers',
    icon: Receipt,
    badge: null,
  },
  {
    name: 'السماسرة',
    href: '/brokers',
    icon: Handshake,
    badge: null,
  },
  {
    name: 'التقارير',
    href: '/reports',
    icon: BarChart3,
    badge: null,
  },
  {
    name: 'الإعدادات',
    href: '/settings',
    icon: Settings,
    badge: null,
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className={cn(
          'fixed right-0 top-0 z-50 h-screen w-72 border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:static lg:z-0 lg:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Building className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">نظام العقارات</h2>
                <p className="text-xs text-muted-foreground">الإصدار الجديد</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">متصل</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                قاعدة البيانات: PostgreSQL
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}