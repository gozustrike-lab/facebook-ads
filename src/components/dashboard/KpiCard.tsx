'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'

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
  const isMobile = useIsMobile()

  if (loading) {
    if (isMobile) {
      return (
        <Card className={cn('border-l-4 border-l-primary/30', className)}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

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

  // Mobile: compact horizontal layout
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={cn('border-l-4 border-l-primary hover:shadow-md transition-shadow', className)}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Icon className={cn('h-4 w-4', iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wide font-medium">
                  {title}
                </p>
                <p className="text-lg font-bold leading-tight">{value}</p>
                {trend && (
                  <p className={cn(
                    'text-[10px] font-medium',
                    trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {trend.positive ? '↑' : '↓'} {trend.value}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Desktop: full layout with trends
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
