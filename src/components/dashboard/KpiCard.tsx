'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    positive: boolean
  }
  className?: string
  loading?: boolean
  iconColor?: string
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  loading,
  iconColor = 'text-primary',
}: KpiCardProps) {
  if (loading) {
    return (
      <Card className={cn('border-l-4 border-l-primary/30', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('border-l-4 border-l-primary hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {trend && (
                <p className={cn(
                  'text-xs font-medium flex items-center gap-1',
                  trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}>
                  <span>{trend.positive ? '↑' : '↓'}</span>
                  {trend.value}%
                  <span className="text-muted-foreground">vs ayer</span>
                </p>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className={cn('p-2.5 rounded-lg bg-primary/10', iconColor)}>
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
