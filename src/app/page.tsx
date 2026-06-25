'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  Target,
  BarChart3,
  Bot,
  Building2,
  RefreshCw,
  Tag,
  Plane,
  Home,
  Stethoscope,
  ShoppingCart,
  Utensils,
  Shield,
  GraduationCap,
  Car,
  Wrench,
  Briefcase,
  ChevronRight,
  Check,
  ArrowRight,
} from 'lucide-react'

/* ─── Animation Helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

/* ─── Data ─── */
const FEATURES = [
  {
    icon: Target,
    title: 'Smart Campaigns',
    emoji: '🎯',
    description: 'AI-generated campaigns for any industry with intelligent audience targeting and creative optimization.',
  },
  {
    icon: BarChart3,
    title: 'Auto-Optimization',
    emoji: '📊',
    description: 'Scale winning ads, pause losers automatically. Real-time budget allocation across channels.',
  },
  {
    icon: Bot,
    title: 'Lead Qualification',
    emoji: '🤖',
    description: 'Chatbot pre-qualifies every lead before they reach your team. Book only high-intent prospects.',
  },
  {
    icon: Building2,
    title: 'Multi-Industry',
    emoji: '🏢',
    description: 'Immigration, Real Estate, Dental, Ecommerce, and more. One platform, every vertical.',
  },
  {
    icon: RefreshCw,
    title: 'Meta Integration',
    emoji: '🔄',
    description: 'Direct Facebook/Instagram ads with Conversions API (CAPI). First-party data, better ROAS.',
  },
  {
    icon: Tag,
    title: 'White-Label',
    emoji: '🏷️',
    description: 'Brand it as your own platform. Custom domains, logos, and colors for agency clients.',
  },
]

const INDUSTRIES = [
  { icon: Plane, name: 'Immigration', description: 'Law firm lead gen & visa campaigns' },
  { icon: Home, name: 'Real Estate', description: 'Property listings & buyer leads' },
  { icon: Stethoscope, name: 'Dental', description: 'Patient acquisition & recall' },
  { icon: ShoppingCart, name: 'Ecommerce', description: 'ROAS optimization & retargeting' },
  { icon: Utensils, name: 'Restaurant', description: 'Local awareness & delivery promos' },
  { icon: Shield, name: 'Insurance', description: 'Quote forms & policy renewals' },
  { icon: GraduationCap, name: 'Coaching', description: 'Webinar funnels & course sales' },
  { icon: Car, name: 'Automotive', description: 'Dealership leads & test drives' },
  { icon: Wrench, name: 'Local Services', description: 'Home service booking & reviews' },
  { icon: Briefcase, name: 'Agency', description: 'Multi-client dashboards & reporting' },
]

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

/* ─── Page Component ─── */
export default function LandingPage() {
  return (
    <div className="dark min-h-screen bg-[#09090b] text-white overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">AdScale OS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#industries" className="hover:text-white transition-colors">Industries</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                Log in
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Animated gradient bg */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-violet-600/20 via-indigo-600/15 to-transparent blur-3xl animate-pulse" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-fuchsia-600/10 to-transparent blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-indigo-600/10 to-transparent blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating industry icons */}
        <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none">
          {[Plane, Home, Stethoscope, ShoppingCart, Shield, Car].map((Icon, i) => (
            <motion.div
              key={i}
              className="absolute text-violet-500/10"
              style={{
                top: `${15 + i * 14}%`,
                left: `${5 + (i * 17) % 90}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Icon className="h-8 w-8 sm:h-12 sm:w-12" />
            </motion.div>
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="outline" className="mb-6 border-violet-500/30 text-violet-300 bg-violet-500/10 px-4 py-1.5 text-sm">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Universal AI Ads Platform
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]"
            >
              <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                AI-Powered Ads
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                Operating System
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            >
              Automate your ad campaigns, qualify leads, and scale budgets — for any industry
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-500/25 px-8 h-12 text-base font-semibold gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white px-8 h-12 text-base font-semibold"
                >
                  See Pricing
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                scale ads
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
              Six powerful modules that work together to automate your entire advertising funnel.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature, i) => (
              <motion.div key={feature.title} variants={fadeUp} custom={i}>
                <Card className="bg-zinc-900/50 border-zinc-800/50 hover:border-violet-500/30 transition-colors duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20">
                        <feature.icon className="h-5 w-5 text-violet-400" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-white">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── INDUSTRIES ─── */}
      <section id="industries" className="py-20 sm:py-28 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">
              Built for{' '}
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                every industry
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-zinc-400 text-lg">
              One platform. Ten verticals. Unlimited scale.
            </motion.p>
          </motion.div>
        </div>

        {/* Horizontal scroll */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-4 mx-auto">
              {INDUSTRIES.map((industry, i) => (
                <motion.div
                  key={industry.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="snap-start"
                >
                  <Card className="w-[200px] sm:w-[220px] bg-zinc-900/50 border-zinc-800/50 hover:border-violet-500/30 transition-colors duration-300">
                    <CardContent className="p-5 text-center space-y-3">
                      <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20">
                        <industry.icon className="h-6 w-6 text-violet-400" />
                      </div>
                      <h3 className="font-semibold text-white text-sm">{industry.name}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">{industry.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 sm:py-28 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">
              Simple, transparent{' '}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                pricing
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-zinc-400 text-lg">
              Start free. Scale as you grow. No hidden fees.
            </motion.p>
          </motion.div>

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

      {/* ─── CTA BAND ─── */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold">
              Ready to scale your ads?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-zinc-400 text-lg">
              Join thousands of businesses using AdScale OS to automate and grow.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-8">
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-500/25 px-10 h-13 text-base font-semibold gap-2"
                >
                  Start Free Trial
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-800/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm text-zinc-500">AdScale OS &copy; 2026</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-zinc-500">
              <Link href="/pricing" className="hover:text-zinc-300 transition-colors">Pricing</Link>
              <a href="#features" className="hover:text-zinc-300 transition-colors">Features</a>
              <a href="#industries" className="hover:text-zinc-300 transition-colors">Industries</a>
              <Link href="/auth/login" className="hover:text-zinc-300 transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
