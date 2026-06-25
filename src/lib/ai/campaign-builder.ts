// AdScale OS — AI Campaign Builder
// Deterministic campaign generation engine based on industry templates
// No external API calls — all logic is template-driven

// =============================================
// Types
// =============================================

export interface CampaignBuilderInput {
  businessType: string
  country: string
  budget: number
  objective: string
  offer: string
  industry?: string
}

export interface CampaignStructure {
  name: string
  objective: string
  funnelType: string
  adSetCount: number
  adFormats: string[]
}

export interface Audience {
  name: string
  type: 'BROAD' | 'LOOKALIKE' | 'CUSTOM'
  description: string
  estimatedSize: string
}

export interface Targeting {
  ageMin: number
  ageMax: number
  genders: ('male' | 'female' | 'all')[]
  locations: string[]
  interests: string[]
  behaviors: string[]
}

export interface BudgetRecommendation {
  dailyBudget: number
  adSetDistribution: { name: string; percentage: number; amount: number }[]
  strategy: string
}

export interface CopySuggestion {
  headline: string
  primaryText: string
  description: string
  cta: string
}

export interface FunnelStep {
  name: string
  channel: string
  description: string
}

export interface CampaignBuilderOutput {
  campaignStructure: CampaignStructure
  audience: Audience[]
  targeting: Targeting
  budgetRecommendation: BudgetRecommendation
  copySuggestions: CopySuggestion[]
  funnelRecommendation: FunnelStep[]
  industry: string
}

// =============================================
// Industry Template Definitions
// =============================================

interface IndustryTemplate {
  audiences: Omit<Audience, 'estimatedSize'>[]
  funnelType: string
  funnelSteps: Omit<FunnelStep, never>[]
  copyTemplates: Omit<CopySuggestion, never>[]
  interests: string[]
  behaviors: string[]
  adFormats: string[]
  ageRange: { min: number; max: number }
  budgetStrategy: 'conservative' | 'balanced' | 'aggressive'
}

const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  immigration: {
    audiences: [
      { name: 'Immigration Seekers', type: 'BROAD', description: 'People interested in visa and immigration services' },
      { name: 'Lookalike – Past Clients', type: 'LOOKALIKE', description: 'Lookalike audience based on existing clients' },
      { name: 'Visa Expiring', type: 'CUSTOM', description: 'Custom audience of users with expiring visa content engagement' },
    ],
    funnelType: 'whatsapp',
    funnelSteps: [
      { name: 'Ad Click', channel: 'Meta Ads', description: 'User clicks ad promoting free consultation' },
      { name: 'WhatsApp Chat', channel: 'WhatsApp', description: 'Automated chat qualifies the lead (visa type, country, budget)' },
      { name: 'Consultation Booking', channel: 'Calendar', description: 'Lead books a consultation with attorney' },
      { name: 'Retainer Signed', channel: 'CRM', description: 'Client signs retainer agreement' },
    ],
    copyTemplates: [
      { headline: 'Need a Visa? We Can Help', primaryText: 'Get expert immigration guidance. Free consultation available now.', description: 'Trusted by thousands of immigrants worldwide', cta: 'Chat on WhatsApp' },
      { headline: 'Your Immigration Journey Starts Here', primaryText: 'Don\'t navigate the immigration process alone. Our experts guide you every step.', description: 'Free initial consultation — no obligation', cta: 'Get Free Consultation' },
      { headline: 'Visa Approved Faster', primaryText: 'Our immigration specialists have a 95% success rate. Start your process today.', description: 'Book your free assessment now', cta: 'Book Assessment' },
    ],
    interests: ['Immigration', 'Visa', 'Travel', 'Law', 'Green Card', 'Citizenship'],
    behaviors: ['Frequent travelers', 'Expats'],
    adFormats: ['image', 'carousel', 'video'],
    ageRange: { min: 25, max: 55 },
    budgetStrategy: 'balanced',
  },

  real_estate: {
    audiences: [
      { name: 'Home Buyers', type: 'BROAD', description: 'People actively looking to buy property' },
      { name: 'Lookalike – Buyers', type: 'LOOKALIKE', description: 'Lookalike based on past property buyers' },
      { name: 'Investment Property Seekers', type: 'CUSTOM', description: 'Users who visited real estate listing pages' },
    ],
    funnelType: 'lead_form',
    funnelSteps: [
      { name: 'Ad Click', channel: 'Meta Ads', description: 'User sees property listing ad and clicks' },
      { name: 'Lead Form', channel: 'Meta Lead Form', description: 'User submits budget, location, and property preferences' },
      { name: 'Property Showing', channel: 'In-Person/Video', description: 'Agent schedules showing based on preferences' },
      { name: 'Offer & Close', channel: 'CRM', description: 'Buyer makes offer and transaction completes' },
    ],
    copyTemplates: [
      { headline: 'Find Your Dream Home', primaryText: 'Browse exclusive listings in your area. Schedule a viewing today.', description: 'New properties added daily', cta: 'See Listings' },
      { headline: 'Selling? Get Top Dollar', primaryText: 'Our agents consistently sell above asking price. Get a free home valuation.', description: 'No obligation — free market analysis', cta: 'Get Valuation' },
      { headline: 'Investment Properties Available', primaryText: 'High-ROI properties in growing markets. Start building your portfolio.', description: 'Exclusive off-market deals', cta: 'View Properties' },
    ],
    interests: ['Real estate investing', 'Property', 'Home improvement', 'Mortgage', 'Interior design'],
    behaviors: ['Home buyers', 'Property searchers'],
    adFormats: ['carousel', 'video', 'collection'],
    ageRange: { min: 28, max: 60 },
    budgetStrategy: 'aggressive',
  },

  dental: {
    audiences: [
      { name: 'Dental Patients', type: 'BROAD', description: 'People searching for dental treatments' },
      { name: 'Lookalike – Patients', type: 'LOOKALIKE', description: 'Lookalike of existing dental patients' },
      { name: 'Treatment-Specific Seekers', type: 'CUSTOM', description: 'Users who engaged with dental health content' },
    ],
    funnelType: 'whatsapp',
    funnelSteps: [
      { name: 'Ad Click', channel: 'Meta Ads', description: 'User sees dental treatment ad' },
      { name: 'WhatsApp/Call', channel: 'WhatsApp/Phone', description: 'Patient inquires about treatment and insurance' },
      { name: 'Appointment Booked', channel: 'Calendar', description: 'Patient schedules appointment' },
      { name: 'Treatment Completed', channel: 'CRM', description: 'Patient completes treatment and pays' },
    ],
    copyTemplates: [
      { headline: 'Smile With Confidence', primaryText: 'Expert dental treatments at affordable prices. Book your free consultation.', description: 'Accepting most insurance plans', cta: 'Book Appointment' },
      { headline: 'Premium Dental Implants', primaryText: 'Restore your smile with state-of-the-art dental implants. Payment plans available.', description: '0% financing available', cta: 'Learn More' },
      { headline: 'Teeth Whitening Special', primaryText: 'Get a brighter smile in just one visit. Limited-time offer — book now.', description: 'Professional results guaranteed', cta: 'Claim Offer' },
    ],
    interests: ['Dental care', 'Cosmetic dentistry', 'Teeth whitening', 'Oral health'],
    behaviors: ['Health & wellness'],
    adFormats: ['image', 'carousel', 'video'],
    ageRange: { min: 22, max: 65 },
    budgetStrategy: 'balanced',
  },

  ecommerce: {
    audiences: [
      { name: 'Product Shoppers', type: 'BROAD', description: 'People interested in online shopping' },
      { name: 'Lookalike – Buyers', type: 'LOOKALIKE', description: 'Lookalike of past purchasers' },
      { name: 'Cart Abandoners', type: 'CUSTOM', description: 'Users who added to cart but didn\'t purchase' },
    ],
    funnelType: 'website',
    funnelSteps: [
      { name: 'Ad Click', channel: 'Meta Ads', description: 'User sees product ad and clicks through' },
      { name: 'Product Page', channel: 'Website', description: 'User browses product page and adds to cart' },
      { name: 'Purchase', channel: 'Checkout', description: 'User completes purchase' },
      { name: 'Repeat Customer', channel: 'Email/Retargeting', description: 'Customer returns for additional purchases' },
    ],
    copyTemplates: [
      { headline: 'Shop the Latest Collection', primaryText: 'New arrivals just dropped. Free shipping on orders over $50.', description: 'Limited stock available', cta: 'Shop Now' },
      { headline: 'Flash Sale — 40% Off', primaryText: 'Don\'t miss our biggest sale of the year. Ends tonight.', description: 'Use code SAVE40 at checkout', cta: 'Shop Sale' },
      { headline: 'Best Sellers Restocked', primaryText: 'Our most popular items are back in stock. Grab yours before they\'re gone.', description: 'Free returns within 30 days', cta: 'Browse Best Sellers' },
    ],
    interests: ['Online shopping', 'Fashion', 'E-commerce', 'Deals & discounts'],
    behaviors: ['Engaged shoppers', 'Online buyers'],
    adFormats: ['carousel', 'collection', 'video', 'dynamic_product'],
    ageRange: { min: 18, max: 50 },
    budgetStrategy: 'aggressive',
  },

  restaurant: {
    audiences: [
      { name: 'Local Diners', type: 'BROAD', description: 'People in the area looking for dining options' },
      { name: 'Lookalike – Regulars', type: 'LOOKALIKE', description: 'Lookalike of frequent diners' },
      { name: 'Special Occasion Seekers', type: 'CUSTOM', description: 'Users searching for restaurants for events' },
    ],
    funnelType: 'messenger',
    funnelSteps: [
      { name: 'Ad Click', channel: 'Meta Ads', description: 'User sees restaurant promo and clicks' },
      { name: 'Reservation', channel: 'Messenger/Website', description: 'User books a table for their party' },
      { name: 'Dine-In Visit', channel: 'In-Person', description: 'Customer visits the restaurant' },
      { name: 'Regular Customer', channel: 'Loyalty/Retargeting', description: 'Customer returns and becomes a regular' },
    ],
    copyTemplates: [
      { headline: 'Reserve Your Table', primaryText: 'Experience exceptional dining. Book your table today.', description: 'Award-winning chef — limited availability', cta: 'Book Now' },
      { headline: 'Happy Hour Special', primaryText: 'Half-price appetizers and drink specials every weekday 4-7 PM.', description: 'Walk-ins welcome', cta: 'See Menu' },
      { headline: 'Private Dining Available', primaryText: 'Host your next event in our private dining room. Custom menus available.', description: 'Groups of 8-50 welcome', cta: 'Inquire Now' },
    ],
    interests: ['Food & dining', 'Restaurants', 'Fine dining', 'Food delivery', 'Wine'],
    behaviors: ['Restaurant goers', 'Foodie enthusiasts'],
    adFormats: ['image', 'carousel', 'video'],
    ageRange: { min: 21, max: 60 },
    budgetStrategy: 'conservative',
  },

  insurance: {
    audiences: [
      { name: 'Insurance Shoppers', type: 'BROAD', description: 'People comparing insurance options' },
      { name: 'Lookalike – Policyholders', type: 'LOOKALIKE', description: 'Lookalike of existing policyholders' },
      { name: 'Life Event Triggers', type: 'CUSTOM', description: 'Users with recent life events (marriage, home purchase, baby)' },
    ],
    funnelType: 'lead_form',
    funnelSteps: [
      { name: 'Ad Click', channel: 'Meta Ads', description: 'User sees insurance ad and clicks' },
      { name: 'Quote Request', channel: 'Lead Form', description: 'User submits info for a personalized quote' },
      { name: 'Application', channel: 'Phone/Form', description: 'Lead applies for coverage' },
      { name: 'Active Policy', channel: 'CRM', description: 'Policy is issued and premium collected' },
    ],
    copyTemplates: [
      { headline: 'Get a Free Insurance Quote', primaryText: 'Compare rates from top providers. Save up to 30% on your premium.', description: 'No spam — just honest quotes', cta: 'Get Quote' },
      { headline: 'Protect What Matters Most', primaryText: 'Comprehensive coverage at competitive rates. Speak with a licensed agent today.', description: 'Trusted by 50,000+ customers', cta: 'Talk to Agent' },
      { headline: 'Switch & Save Today', primaryText: 'You could be overpaying for insurance. Find out in 60 seconds.', description: 'Free comparison — no obligation', cta: 'Compare Rates' },
    ],
    interests: ['Insurance', 'Financial planning', 'Investment', 'Home ownership'],
    behaviors: ['Financial services seekers'],
    adFormats: ['image', 'lead_form', 'video'],
    ageRange: { min: 30, max: 60 },
    budgetStrategy: 'balanced',
  },

  coaching: {
    audiences: [
      { name: 'Self-Improvement Seekers', type: 'BROAD', description: 'People interested in personal and professional growth' },
      { name: 'Lookalike – Clients', type: 'LOOKALIKE', description: 'Lookalike of existing coaching clients' },
      { name: 'Career Advancers', type: 'CUSTOM', description: 'Users engaging with professional development content' },
    ],
    funnelType: 'messenger',
    funnelSteps: [
      { name: 'Ad Click', channel: 'Meta Ads', description: 'User sees coaching ad and clicks' },
      { name: 'Discovery Call', channel: 'Messenger/Calendar', description: 'Lead books a free discovery session' },
      { name: 'Coaching Session', channel: 'Zoom/Phone', description: 'Lead attends first coaching session' },
      { name: 'Member', channel: 'CRM', description: 'Client signs up for ongoing coaching program' },
    ],
    copyTemplates: [
      { headline: 'Unlock Your Potential', primaryText: 'Transform your career and life with 1-on-1 coaching. Book a free discovery call.', description: 'Limited spots available this month', cta: 'Book Free Call' },
      { headline: 'Achieve Your Goals Faster', primaryText: 'Get the accountability and strategy you need. Our clients see results in 30 days.', description: '100% satisfaction guarantee', cta: 'Start Today' },
      { headline: 'Free Masterclass', primaryText: 'Join our upcoming masterclass on peak performance. Reserve your spot now.', description: 'Live session — interactive Q&A', cta: 'Reserve Spot' },
    ],
    interests: ['Personal development', 'Entrepreneurship', 'Leadership', 'Career growth', 'Mindfulness'],
    behaviors: ['Business page admins', 'Engaged shoppers'],
    adFormats: ['video', 'image', 'carousel'],
    ageRange: { min: 25, max: 55 },
    budgetStrategy: 'balanced',
  },

  automotive: {
    audiences: [
      { name: 'Car Shoppers', type: 'BROAD', description: 'People in the market for a vehicle' },
      { name: 'Lookalike – Buyers', type: 'LOOKALIKE', description: 'Lookalike of past vehicle buyers' },
      { name: 'Model-Specific Interest', type: 'CUSTOM', description: 'Users researching specific vehicle models' },
    ],
    funnelType: 'lead_form',
    funnelSteps: [
      { name: 'Ad Click', channel: 'Meta Ads', description: 'User sees vehicle ad and clicks' },
      { name: 'Test Drive', channel: 'Lead Form/Calendar', description: 'Lead schedules a test drive' },
      { name: 'Negotiation', channel: 'In-Person/Phone', description: 'Sales rep negotiates deal' },
      { name: 'Vehicle Sold', channel: 'CRM', description: 'Deal closed and vehicle delivered' },
    ],
    copyTemplates: [
      { headline: 'Schedule a Test Drive', primaryText: 'Experience the thrill of driving. Book your test drive today — no commitment.', description: 'New & pre-owned inventory available', cta: 'Book Test Drive' },
      { headline: 'Special Financing Available', primaryText: '0% APR for qualified buyers. Don\'t miss this limited-time offer.', description: 'Trade-in bonuses available', cta: 'See Offers' },
      { headline: 'Your Next Car Is Waiting', primaryText: 'Browse our extensive inventory online. Virtual tours available.', description: 'Home delivery available', cta: 'Browse Inventory' },
    ],
    interests: ['Automotive', 'Cars', 'Motor vehicles', 'Auto racing'],
    behaviors: ['Auto intenders', 'In-market for vehicles'],
    adFormats: ['carousel', 'video', 'collection'],
    ageRange: { min: 25, max: 60 },
    budgetStrategy: 'aggressive',
  },

  local_services: {
    audiences: [
      { name: 'Local Service Seekers', type: 'BROAD', description: 'People looking for local service providers' },
      { name: 'Lookalike – Customers', type: 'LOOKALIKE', description: 'Lookalike of past service customers' },
      { name: 'Urgent Need', type: 'CUSTOM', description: 'Users with urgent service needs based on behavior' },
    ],
    funnelType: 'whatsapp',
    funnelSteps: [
      { name: 'Ad Click', channel: 'Meta Ads', description: 'User sees service ad and clicks' },
      { name: 'Quote Request', channel: 'WhatsApp/Lead Form', description: 'User requests a quote for service' },
      { name: 'Service Booked', channel: 'Calendar/Phone', description: 'Service appointment is scheduled' },
      { name: 'Completed', channel: 'CRM', description: 'Service is completed and payment collected' },
    ],
    copyTemplates: [
      { headline: 'Need It Fixed? We Can Help', primaryText: 'Fast, reliable service in your area. Get a free quote in minutes.', description: 'Licensed & insured professionals', cta: 'Get Free Quote' },
      { headline: 'Same-Day Service Available', primaryText: 'Don\'t wait. Our team can be at your door today. Call now for immediate assistance.', description: '5-star rated on Google', cta: 'Call Now' },
      { headline: 'Trusted Local Experts', primaryText: 'Serving your community for 10+ years. Satisfaction guaranteed.', description: 'Free estimates — no hidden fees', cta: 'Request Estimate' },
    ],
    interests: ['Home improvement', 'Home services', 'Repair', 'Maintenance'],
    behaviors: ['Homeowners', 'Home services seekers'],
    adFormats: ['image', 'video', 'lead_form'],
    ageRange: { min: 30, max: 65 },
    budgetStrategy: 'conservative',
  },

  agency: {
    audiences: [
      { name: 'Business Owners', type: 'BROAD', description: 'Business owners looking for marketing services' },
      { name: 'Lookalike – Clients', type: 'LOOKALIKE', description: 'Lookalike of existing agency clients' },
      { name: 'Ad Spenders', type: 'CUSTOM', description: 'Businesses currently spending on advertising' },
    ],
    funnelType: 'website',
    funnelSteps: [
      { name: 'Ad Click', channel: 'Meta Ads', description: 'Business owner sees agency ad and clicks' },
      { name: 'Proposal Request', channel: 'Website Form', description: 'Lead submits business details for a custom proposal' },
      { name: 'Onboarding', channel: 'Call/Meeting', description: 'Client is onboarded with strategy and setup' },
      { name: 'Active Client', channel: 'CRM', description: 'Client is actively managed and retains services' },
    ],
    copyTemplates: [
      { headline: 'Scale Your Business With Ads', primaryText: 'We manage your ad spend so you get maximum ROI. Free strategy session included.', description: 'Avg. client sees 3x return', cta: 'Book Strategy Call' },
      { headline: 'Stop Wasting Ad Spend', primaryText: 'Our team optimizes your campaigns for maximum conversions. See results in 14 days.', description: 'No long-term contracts', cta: 'Get Audit' },
      { headline: 'Free Ad Performance Audit', primaryText: 'Get a detailed analysis of your current campaigns and how to improve them.', description: 'No obligation — actionable insights', cta: 'Claim Free Audit' },
    ],
    interests: ['Digital marketing', 'Business', 'Entrepreneurship', 'Advertising', 'Social media marketing'],
    behaviors: ['Business page admins', 'Engaged shoppers', 'Facebook Page admins'],
    adFormats: ['video', 'carousel', 'lead_form'],
    ageRange: { min: 28, max: 55 },
    budgetStrategy: 'aggressive',
  },
}

// =============================================
// Budget Allocation Helpers
// =============================================

function calculateBudgetAllocation(
  budget: number,
  audienceCount: number,
  strategy: 'conservative' | 'balanced' | 'aggressive',
): BudgetRecommendation {
  const strategyMultiplier: Record<string, number> = {
    conservative: 0.7,
    balanced: 1.0,
    aggressive: 1.3,
  }

  const adjustedBudget = budget * (strategyMultiplier[strategy] ?? 1.0)
  const dailyBudget = Math.round((adjustedBudget / 30) * 100) / 100

  // Distribute across audiences with weighting
  const weights = audienceCount === 1
    ? [1]
    : audienceCount === 2
      ? [0.6, 0.4]
      : audienceCount === 3
        ? [0.5, 0.3, 0.2]
        : Array(audienceCount).fill(1 / audienceCount)

  const adSetDistribution = weights.map((pct, i) => ({
    name: `Ad Set ${i + 1}`,
    percentage: Math.round(pct * 100),
    amount: Math.round(dailyBudget * pct * 100) / 100,
  }))

  const strategyDescriptions: Record<string, string> = {
    conservative: 'Conservative: 70% of budget allocated. Focus on proven audiences first.',
    balanced: 'Balanced: Full budget allocated across all audiences evenly.',
    aggressive: 'Aggressive: 130% budget push. Scale quickly on winning audiences.',
  }

  return {
    dailyBudget,
    adSetDistribution,
    strategy: strategyDescriptions[strategy] ?? strategyDescriptions.balanced,
  }
}

// =============================================
// Main Builder Function
// =============================================

export function buildCampaign(input: CampaignBuilderInput): CampaignBuilderOutput {
  const industry = input.industry ?? inferIndustry(input.businessType)
  const template = INDUSTRY_TEMPLATES[industry] ?? INDUSTRY_TEMPLATES.local_services

  const audiences: Audience[] = template.audiences.map((a) => ({
    ...a,
    estimatedSize: estimateAudienceSize(a.type, input.country),
  }))

  const campaignStructure: CampaignStructure = {
    name: `${input.businessType} — ${input.objective} Campaign`,
    objective: input.objective,
    funnelType: template.funnelType,
    adSetCount: audiences.length,
    adFormats: template.adFormats,
  }

  const targeting: Targeting = {
    ageMin: template.ageRange.min,
    ageMax: template.ageRange.max,
    genders: ['all'],
    locations: [input.country],
    interests: template.interests,
    behaviors: template.behaviors,
  }

  const budgetRecommendation = calculateBudgetAllocation(
    input.budget,
    audiences.length,
    template.budgetStrategy,
  )

  const copySuggestions: CopySuggestion[] = template.copyTemplates.map((ct) => ({
    headline: ct.headline.replace('{offer}', input.offer),
    primaryText: ct.primaryText.replace('{offer}', input.offer),
    description: ct.description.replace('{offer}', input.offer),
    cta: ct.cta,
  }))

  const funnelRecommendation: FunnelStep[] = template.funnelSteps

  return {
    campaignStructure,
    audience: audiences,
    targeting,
    budgetRecommendation,
    copySuggestions,
    funnelRecommendation,
    industry,
  }
}

// =============================================
// Helpers
// =============================================

function inferIndustry(businessType: string): string {
  const normalized = businessType.toLowerCase().replace(/[\s-]/g, '_')
  const mapping: Record<string, string> = {
    immigration: 'immigration',
    law_firm: 'immigration',
    law: 'immigration',
    real_estate: 'real_estate',
    realty: 'real_estate',
    property: 'real_estate',
    dental: 'dental',
    dentist: 'dental',
    orthodontist: 'dental',
    ecommerce: 'ecommerce',
    e_commerce: 'ecommerce',
    online_store: 'ecommerce',
    shop: 'ecommerce',
    restaurant: 'restaurant',
    food: 'restaurant',
    dining: 'restaurant',
    insurance: 'insurance',
    coaching: 'coaching',
    consulting: 'coaching',
    mentor: 'coaching',
    automotive: 'automotive',
    car: 'automotive',
    auto: 'automotive',
    dealership: 'automotive',
    local_services: 'local_services',
    home_service: 'local_services',
    repair: 'local_services',
    agency: 'agency',
    marketing: 'agency',
    advertising: 'agency',
  }
  return mapping[normalized] ?? 'local_services'
}

function estimateAudienceSize(type: Audience['type'], _country: string): string {
  const sizeRanges: Record<string, string> = {
    BROAD: '500K – 2M',
    LOOKALIKE: '100K – 500K',
    CUSTOM: '10K – 100K',
  }
  return sizeRanges[type] ?? '100K – 500K'
}
