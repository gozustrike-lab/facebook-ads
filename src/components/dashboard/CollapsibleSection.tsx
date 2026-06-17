'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useMediaQuery } from '@/hooks/use-media-query'

interface CollapsibleSectionProps {
  value: string
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({ value, title, icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  // On mobile: collapsed by default. On desktop: use defaultOpen
  const defaultValue = isMobile ? [] : (defaultOpen ? [value] : [])

  return (
    <Accordion type="multiple" defaultValue={defaultValue}>
      <AccordionItem value={value} className="border rounded-lg">
        <AccordionTrigger className="text-sm font-semibold px-4 py-3 hover:no-underline">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
