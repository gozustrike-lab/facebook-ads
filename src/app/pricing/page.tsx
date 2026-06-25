'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Check, ArrowLeft } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'Perfect for a single business getting started with AI ads.',
    features: [
      '1 Industry vertical',
      'Up to 5 active campaigns',
      'Basic lead qualification chatbot',
      'Meta Ads integration',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$149',
    period: '/mo',
    description: 'For growing businesses that need full automation.',
    features: [
      '3 Industry verticals',
      'Unlimited campaigns',
      'Advanced AI chatbot + qualification',
      'Meta CAPI integration',
      'Auto-optimization engine',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Agency',
    price: '$399',
    period: '/mo',
    description: 'For agencies managing multiple clients at scale.',
    features: [
      'Unlimited industry verticals',
      'Unlimited campaigns & ad spend',
      'White-label platform',
      'Multi-client dashboard',
      'Custom integrations & API',
      'Dedicated account manager',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
]

const COMPARISON = [
  { feature: 'Industry verticals', starter: '1', growth: '3', agency: 'Unlimited' },
  { feature: 'Active campaigns', starter: '5', growth: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Lead qualification chatbot', starter: 'Basic', growth: 'Advanced', agency: 'Advanced' },
  { feature: 'Meta Ads integration', starter: true, growth: true, agency: true },
  { feature: 'Conversions API (CAPI)', starter: false, growth: true, agency: true },
  { feature: 'Auto-optimization', starter: false, growth: true, agency: true },
  { feature: 'White-label', starter: false, growth: false, agency: true },
  { feature: 'Multi-client dashboard', starter: false, growth: false, agency: true },
  { feature: 'Custom integrations', starter: false, growth: false, agency: true },
  { feature: 'Support', starter: 'Email', growth: 'Priority', agency: 'Dedicated manager' },
]

export default function PricingPage() {
  return (
    <div className="dark min-h-screen bg-[#09090b] text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">AdScale OS</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-16 pb-12 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-zinc-400 text-lg">
              Start free. Scale as you grow. No hidden fees.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto"
          >
            {PRICING_TIERS.map((tier, i) => (
              <motion.div key={tier.name} variants={fadeUp} custom={i}>
                <Card className={`h-full flex flex-col ${
                  tier.highlighted
                    ? 'bg-gradient-to-b from-violet-600/10 to-indigo-600/5 border-violet-500/40 shadow-xl shadow-violet-500/10'
                    : 'bg-zinc-900/50 border-zinc-800/50'
                }`}>
                  <CardHeader>
                    {tier.highlighted && (
                      <Badge className="w-fit mb-2 bg-violet-600 text-white border-0">Most Popular</Badge>
                    )}
                    <CardTitle className="text-xl font-bold text-white">{tier.name}</CardTitle>
                    <p className="text-zinc-400 text-sm">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                      <span className="text-zinc-500">{tier.period}</span>
                    </div>
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-300">
                          <Check className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/auth/login" className="w-full">
                      <Button
                        className={`w-full font-semibold ${
                          tier.highlighted
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        }`}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="pb-20 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <h2 className="text-2xl font-bold text-center mb-10">
            Feature{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              comparison
            </span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left py-4 px-4 text-zinc-400 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 text-zinc-400 font-medium">Starter</th>
                  <th className="text-center py-4 px-4 text-violet-400 font-semibold">Growth</th>
                  <th className="text-center py-4 px-4 text-zinc-400 font-medium">Agency</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-zinc-800/30 ${i % 2 === 0 ? 'bg-zinc-900/20' : ''}`}>
                    <td className="py-3 px-4 text-zinc-300">{row.feature}</td>
                    {(['starter', 'growth', 'agency'] as const).map((tier) => {
                      const val = row[tier]
                      return (
                        <td key={tier} className="text-center py-3 px-4">
                          {typeof val === 'boolean' ? (
                            val ? (
                              <Check className="h-4 w-4 text-violet-400 mx-auto" />
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )
                          ) : (
                            <span className={tier === 'growth' ? 'text-violet-300 font-medium' : 'text-zinc-400'}>
                              {val}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm text-zinc-500">AdScale OS &copy; 2026</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-zinc-500">
              <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
              <Link href="/auth/login" className="hover:text-zinc-300 transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
