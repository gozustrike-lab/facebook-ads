// AdScale OS — Industry Pack Registry
// Centralized configuration for all supported industries
// Each industry defines lead fields, pipeline stages, KPIs, and chatbot flows

// =============================================
// Type Definitions
// =============================================

export type FieldType = 'text' | 'select' | 'number' | 'boolean'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  options?: string[]
}

export interface IndustryConfig {
  id: string
  name: string
  icon: string
  defaultLeadFields: FieldDef[]
  defaultPipelineStages: string[]
  defaultKPIs: string[]
  defaultChatbotFlow: Record<string, unknown>
  color: string
}

// =============================================
// Industry Configurations
// =============================================

export const INDUSTRIES: Record<string, IndustryConfig> = {
  immigration: {
    id: 'immigration',
    name: 'Immigration Law',
    icon: 'Globe',
    defaultLeadFields: [
      { key: 'visaType', label: 'Visa Type', type: 'select', options: ['EB-1', 'EB-2', 'EB-3', 'H-1B', 'L-1', 'O-1', 'TN', 'E-2', 'Family', 'Asylum', 'Other'] },
      { key: 'country', label: 'Country of Origin', type: 'text' },
      { key: 'hasCriminalRecord', label: 'Has Criminal Record', type: 'boolean' },
      { key: 'investmentCapacity', label: 'Investment Capacity', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH'] },
    ],
    defaultPipelineStages: ['Lead', 'Consult', 'Retainer', 'Case Open'],
    defaultKPIs: ['CPL', 'Consultation Rate', 'Retainer Rate', 'Case Value', 'Lead Quality Score'],
    defaultChatbotFlow: {
      greeting: 'Welcome! How can we help with your immigration needs?',
      steps: [
        { id: 'visa_type', question: 'What type of visa are you interested in?', field: 'visaType', type: 'select' },
        { id: 'country', question: 'What is your country of origin?', field: 'country', type: 'text' },
        { id: 'criminal_record', question: 'Do you have any criminal record?', field: 'hasCriminalRecord', type: 'boolean' },
        { id: 'investment', question: 'What is your investment capacity?', field: 'investmentCapacity', type: 'select' },
        { id: 'schedule', question: 'Would you like to schedule a free consultation?', type: 'cta' },
      ],
    },
    color: '#3B82F6',
  },

  real_estate: {
    id: 'real_estate',
    name: 'Real Estate',
    icon: 'Home',
    defaultLeadFields: [
      { key: 'budget', label: 'Budget', type: 'number' },
      { key: 'propertyType', label: 'Property Type', type: 'select', options: ['House', 'Apartment', 'Commercial'] },
      { key: 'location', label: 'Preferred Location', type: 'text' },
    ],
    defaultPipelineStages: ['Lead', 'Showing', 'Offer', 'Closed'],
    defaultKPIs: ['CPL', 'Showing Rate', 'Offer Rate', 'Close Rate', 'Average Property Value'],
    defaultChatbotFlow: {
      greeting: 'Find your perfect property! Let us know what you\'re looking for.',
      steps: [
        { id: 'property_type', question: 'What type of property are you looking for?', field: 'propertyType', type: 'select' },
        { id: 'budget', question: 'What is your budget range?', field: 'budget', type: 'number' },
        { id: 'location', question: 'Where would you like the property to be?', field: 'location', type: 'text' },
        { id: 'schedule', question: 'Would you like to schedule a viewing?', type: 'cta' },
      ],
    },
    color: '#10B981',
  },

  dental: {
    id: 'dental',
    name: 'Dental',
    icon: 'Heart',
    defaultLeadFields: [
      { key: 'treatment', label: 'Treatment', type: 'select', options: ['Implants', 'Whitening', 'Braces', 'Root Canal', 'Cleaning', 'Veneers', 'Crowns', 'Other'] },
      { key: 'insurance', label: 'Has Insurance', type: 'boolean' },
      { key: 'preferredDate', label: 'Preferred Date', type: 'text' },
    ],
    defaultPipelineStages: ['Lead', 'Appointment', 'Treatment', 'Paid'],
    defaultKPIs: ['CPL', 'Appointment Rate', 'Treatment Rate', 'Collection Rate', 'Patient Lifetime Value'],
    defaultChatbotFlow: {
      greeting: 'Welcome! Ready to get the smile you deserve?',
      steps: [
        { id: 'treatment', question: 'What treatment are you interested in?', field: 'treatment', type: 'select' },
        { id: 'insurance', question: 'Do you have dental insurance?', field: 'insurance', type: 'boolean' },
        { id: 'preferred_date', question: 'When would you like to come in?', field: 'preferredDate', type: 'text' },
        { id: 'schedule', question: 'Ready to book your appointment?', type: 'cta' },
      ],
    },
    color: '#8B5CF6',
  },

  ecommerce: {
    id: 'ecommerce',
    name: 'E-Commerce',
    icon: 'ShoppingCart',
    defaultLeadFields: [
      { key: 'productCategory', label: 'Product Category', type: 'text' },
      { key: 'cartValue', label: 'Average Cart Value', type: 'number' },
      { key: 'purchaseFrequency', label: 'Purchase Frequency', type: 'select', options: ['One-time', 'Monthly', 'Weekly', 'Daily'] },
    ],
    defaultPipelineStages: ['Lead', 'Cart', 'Purchase', 'Repeat'],
    defaultKPIs: ['CPA', 'ROAS', 'Cart Abandonment Rate', 'Repeat Purchase Rate', 'Average Order Value'],
    defaultChatbotFlow: {
      greeting: 'Discover products you\'ll love! How can we help?',
      steps: [
        { id: 'category', question: 'What product category interests you?', field: 'productCategory', type: 'text' },
        { id: 'cart_value', question: 'What\'s your typical spending range?', field: 'cartValue', type: 'number' },
        { id: 'frequency', question: 'How often do you shop online?', field: 'purchaseFrequency', type: 'select' },
        { id: 'promo', question: 'Would you like to see our current promotions?', type: 'cta' },
      ],
    },
    color: '#F59E0B',
  },

  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    icon: 'UtensilsCrossed',
    defaultLeadFields: [
      { key: 'partySize', label: 'Party Size', type: 'number' },
      { key: 'reservationDate', label: 'Reservation Date', type: 'text' },
      { key: 'occasion', label: 'Occasion', type: 'select', options: ['Casual', 'Birthday', 'Anniversary', 'Business', 'Date Night', 'Family', 'Other'] },
    ],
    defaultPipelineStages: ['Lead', 'Reservation', 'Visit', 'Regular'],
    defaultKPIs: ['CPL', 'Reservation Rate', 'Show Rate', 'Average Check', 'Repeat Visit Rate'],
    defaultChatbotFlow: {
      greeting: 'Reserve your table! We\'d love to host you.',
      steps: [
        { id: 'party_size', question: 'How many guests?', field: 'partySize', type: 'number' },
        { id: 'date', question: 'When would you like to visit?', field: 'reservationDate', type: 'text' },
        { id: 'occasion', question: 'What\'s the occasion?', field: 'occasion', type: 'select' },
        { id: 'reserve', question: 'Ready to reserve your table?', type: 'cta' },
      ],
    },
    color: '#EF4444',
  },

  insurance: {
    id: 'insurance',
    name: 'Insurance',
    icon: 'Shield',
    defaultLeadFields: [
      { key: 'insuranceType', label: 'Insurance Type', type: 'select', options: ['Auto', 'Home', 'Life', 'Health', 'Business', 'Travel', 'Pet', 'Other'] },
      { key: 'coverageAmount', label: 'Coverage Amount', type: 'number' },
      { key: 'riskProfile', label: 'Risk Profile', type: 'select', options: ['Low', 'Medium', 'High'] },
    ],
    defaultPipelineStages: ['Lead', 'Quote', 'Application', 'Active'],
    defaultKPIs: ['CPL', 'Quote Rate', 'Application Rate', 'Bind Rate', 'Premium Volume'],
    defaultChatbotFlow: {
      greeting: 'Get the coverage you need at the best price!',
      steps: [
        { id: 'type', question: 'What type of insurance are you looking for?', field: 'insuranceType', type: 'select' },
        { id: 'coverage', question: 'How much coverage do you need?', field: 'coverageAmount', type: 'number' },
        { id: 'risk', question: 'How would you rate your risk level?', field: 'riskProfile', type: 'select' },
        { id: 'quote', question: 'Ready to get your free quote?', type: 'cta' },
      ],
    },
    color: '#06B6D4',
  },

  coaching: {
    id: 'coaching',
    name: 'Coaching',
    icon: 'GraduationCap',
    defaultLeadFields: [
      { key: 'coachingType', label: 'Coaching Type', type: 'select', options: ['Business', 'Career', 'Life', 'Health', 'Executive', 'Relationship', 'Other'] },
      { key: 'experience', label: 'Current Experience Level', type: 'text' },
      { key: 'goals', label: 'Primary Goals', type: 'text' },
    ],
    defaultPipelineStages: ['Lead', 'Discovery', 'Session', 'Member'],
    defaultKPIs: ['CPL', 'Discovery Call Rate', 'Conversion Rate', 'Client Lifetime Value', 'Retention Rate'],
    defaultChatbotFlow: {
      greeting: 'Ready to unlock your potential? Let\'s find the right coaching for you.',
      steps: [
        { id: 'coaching_type', question: 'What area do you want coaching in?', field: 'coachingType', type: 'select' },
        { id: 'experience', question: 'What\'s your current experience level?', field: 'experience', type: 'text' },
        { id: 'goals', question: 'What are your primary goals?', field: 'goals', type: 'text' },
        { id: 'book', question: 'Ready to book a free discovery call?', type: 'cta' },
      ],
    },
    color: '#8B5CF6',
  },

  automotive: {
    id: 'automotive',
    name: 'Automotive',
    icon: 'Car',
    defaultLeadFields: [
      { key: 'vehicleType', label: 'Vehicle Type', type: 'select', options: ['Sedan', 'SUV', 'Truck', 'Coupe', 'Van', 'Electric', 'Luxury', 'Pre-Owned'] },
      { key: 'budget', label: 'Budget', type: 'number' },
      { key: 'timeline', label: 'Purchase Timeline', type: 'select', options: ['Immediately', 'Within 30 Days', '1–3 Months', '3–6 Months', 'Just Browsing'] },
    ],
    defaultPipelineStages: ['Lead', 'Test Drive', 'Negotiate', 'Sold'],
    defaultKPIs: ['CPL', 'Test Drive Rate', 'Close Rate', 'Average Vehicle Price', 'Finance Penetration'],
    defaultChatbotFlow: {
      greeting: 'Find your next vehicle! Let us help you get the best deal.',
      steps: [
        { id: 'vehicle_type', question: 'What type of vehicle are you looking for?', field: 'vehicleType', type: 'select' },
        { id: 'budget', question: 'What\'s your budget range?', field: 'budget', type: 'number' },
        { id: 'timeline', question: 'When are you planning to buy?', field: 'timeline', type: 'select' },
        { id: 'test_drive', question: 'Would you like to schedule a test drive?', type: 'cta' },
      ],
    },
    color: '#F97316',
  },

  local_services: {
    id: 'local_services',
    name: 'Local Services',
    icon: 'Wrench',
    defaultLeadFields: [
      { key: 'serviceType', label: 'Service Type', type: 'text' },
      { key: 'urgency', label: 'Urgency', type: 'select', options: ['Emergency', 'Urgent', 'This Week', 'Flexible', 'Just Planning'] },
      { key: 'location', label: 'Location', type: 'text' },
    ],
    defaultPipelineStages: ['Lead', 'Quote', 'Booked', 'Completed'],
    defaultKPIs: ['CPL', 'Quote Rate', 'Booking Rate', 'Completion Rate', 'Customer Satisfaction'],
    defaultChatbotFlow: {
      greeting: 'Need a local service? We\'ll connect you with trusted professionals.',
      steps: [
        { id: 'service', question: 'What service do you need?', field: 'serviceType', type: 'text' },
        { id: 'urgency', question: 'How urgent is your request?', field: 'urgency', type: 'select' },
        { id: 'location', question: 'What\'s your location?', field: 'location', type: 'text' },
        { id: 'quote', question: 'Ready to get a free quote?', type: 'cta' },
      ],
    },
    color: '#14B8A6',
  },

  agency: {
    id: 'agency',
    name: 'Agency',
    icon: 'Briefcase',
    defaultLeadFields: [
      { key: 'clientType', label: 'Client Type', type: 'select', options: ['Startup', 'SMB', 'Enterprise', 'E-Commerce', 'Local Business', 'Franchise', 'Other'] },
      { key: 'monthlyBudget', label: 'Monthly Ad Budget', type: 'number' },
      { key: 'goals', label: 'Primary Goals', type: 'text' },
    ],
    defaultPipelineStages: ['Lead', 'Proposal', 'Onboard', 'Active'],
    defaultKPIs: ['CPL', 'Proposal Rate', 'Close Rate', 'Monthly Retainer Value', 'Client Retention'],
    defaultChatbotFlow: {
      greeting: 'Scale your business with expert ad management!',
      steps: [
        { id: 'client_type', question: 'What type of business do you run?', field: 'clientType', type: 'select' },
        { id: 'budget', question: 'What\'s your monthly ad budget?', field: 'monthlyBudget', type: 'number' },
        { id: 'goals', question: 'What are your primary marketing goals?', field: 'goals', type: 'text' },
        { id: 'audit', question: 'Want a free ad performance audit?', type: 'cta' },
      ],
    },
    color: '#6366F1',
  },
}

// =============================================
// Accessor Functions
// =============================================

/**
 * Returns the full configuration for a given industry.
 * Falls back to `local_services` if the industry is not found.
 */
export function getIndustryConfig(industry: string): IndustryConfig {
  return INDUSTRIES[industry] ?? INDUSTRIES.local_services
}

/**
 * Returns a lightweight list of all available industries
 * (id, name, icon, color) — suitable for UI pickers and navigation.
 */
export function getIndustryList(): { id: string; name: string; icon: string; color: string }[] {
  return Object.values(INDUSTRIES).map(({ id, name, icon, color }) => ({
    id,
    name,
    icon,
    color,
  }))
}
