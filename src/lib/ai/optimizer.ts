// AdScale OS — AI Optimizer Engine
// Rules-based ad set optimization with deterministic decision logic
// No external API calls — all decisions are computed locally

// =============================================
// Types
// =============================================

export interface OptimizerInput {
  /** Cost per lead (current) */
  cpl: number
  /** Click-through rate (%) */
  ctr: number
  /** Ad frequency (avg impressions per user) */
  frequency: number
  /** Return on ad spend */
  roas: number
  /** Lead-to-customer conversion rate (%) */
  conversionRate: number
  /** Lead quality score (0–100) */
  leadQuality: number
  /** Target cost per lead */
  targetCpl: number
  /** Current daily budget */
  budget: number
}

export type OptimizerAction =
  | 'scale'
  | 'pause'
  | 'duplicate'
  | 'refresh_creative'
  | 'expand_audience'

export interface OptimizerOutput {
  action: OptimizerAction
  budgetChange: number
  reason: string
  confidence: number
}

// =============================================
// Optimization Rules Engine
// =============================================

/**
 * Evaluates ad set metrics against rules-based thresholds and returns
 * an optimization recommendation.
 *
 * Rules are evaluated in priority order. The first matching rule wins.
 *
 * | # | Condition                                        | Action            | Budget |
 * |---|--------------------------------------------------|-------------------|--------|
 * | 1 | CPL > target × 1.5                               | pause             | −100%  |
 * | 2 | Lead quality < 30                                | pause             | −100%  |
 * | 3 | Frequency > 3 AND CTR < 1.0 (declining signal)  | refresh_creative  |   0%   |
 * | 4 | CPL < target × 0.7 AND lead quality > 60        | scale             | +25%   |
 * | 5 | CPL < target AND audience small (proxy: low freq)| expand_audience   | +10%   |
 * | 6 | All metrics good AND budget allows               | duplicate         | +50%   |
 * | 7 | Default — maintain                               | scale (hold)      |   0%   |
 */
export function optimizeAdSet(input: OptimizerInput): OptimizerOutput {
  const {
    cpl,
    ctr,
    frequency,
    roas,
    conversionRate,
    leadQuality,
    targetCpl,
    budget,
  } = input

  // ---- Rule 1: CPL way over target → pause ----
  if (targetCpl > 0 && cpl > targetCpl * 1.5) {
    return {
      action: 'pause',
      budgetChange: -budget,
      reason: `CPL ($${cpl.toFixed(2)}) exceeds 1.5× target ($${(targetCpl * 1.5).toFixed(2)}). Kill switch triggered — pause immediately to stop waste.`,
      confidence: 0.95,
    }
  }

  // ---- Rule 2: Very poor lead quality → pause ----
  if (leadQuality < 30) {
    return {
      action: 'pause',
      budgetChange: -budget,
      reason: `Lead quality (${leadQuality}/100) is critically low (< 30). Leads are unlikely to convert — pause to reallocate budget.`,
      confidence: 0.88,
    }
  }

  // ---- Rule 3: Frequency too high with declining CTR → refresh creative ----
  if (frequency > 3 && ctr < 1.0) {
    return {
      action: 'refresh_creative',
      budgetChange: 0,
      reason: `Frequency (${frequency.toFixed(1)}) is above 3 and CTR (${ctr.toFixed(2)}%) is declining. Audience is experiencing ad fatigue — refresh creative to re-engage.`,
      confidence: 0.82,
    }
  }

  // ---- Rule 4: Strong CPL and good lead quality → scale ----
  if (targetCpl > 0 && cpl < targetCpl * 0.7 && leadQuality > 60) {
    const increase = Math.round(budget * 0.25 * 100) / 100
    return {
      action: 'scale',
      budgetChange: increase,
      reason: `CPL ($${cpl.toFixed(2)}) is 30%+ below target ($${targetCpl.toFixed(2)}) and lead quality is strong (${leadQuality}/100). Scale budget by 25% to capture more high-quality leads.`,
      confidence: 0.90,
    }
  }

  // ---- Rule 5: CPL under target but audience seems small → expand audience ----
  if (targetCpl > 0 && cpl < targetCpl && frequency < 1.5) {
    const increase = Math.round(budget * 0.10 * 100) / 100
    return {
      action: 'expand_audience',
      budgetChange: increase,
      reason: `CPL ($${cpl.toFixed(2)}) is under target ($${targetCpl.toFixed(2)}) with low frequency (${frequency.toFixed(1)}). Audience has room to grow — expand targeting to reach more potential leads.`,
      confidence: 0.78,
    }
  }

  // ---- Rule 6: All metrics good and room to duplicate ----
  const allMetricsGood =
    cpl <= targetCpl &&
    leadQuality >= 50 &&
    ctr >= 1.0 &&
    roas >= 1.5 &&
    conversionRate >= 5 &&
    frequency <= 2.5

  if (allMetricsGood && budget > 0) {
    const increase = Math.round(budget * 0.50 * 100) / 100
    return {
      action: 'duplicate',
      budgetChange: increase,
      reason: `All metrics are healthy — CPL $${cpl.toFixed(2)} (≤ $${targetCpl.toFixed(2)}), CTR ${ctr.toFixed(2)}%, ROAS ${roas.toFixed(2)}x, lead quality ${leadQuality}/100. Duplicate best-performing ad set with +50% budget to scale winning formula.`,
      confidence: 0.85,
    }
  }

  // ---- Default: hold position with neutral scaling ----
  return {
    action: 'scale',
    budgetChange: 0,
    reason: `Metrics are within acceptable range — CPL $${cpl.toFixed(2)} vs target $${targetCpl.toFixed(2)}, lead quality ${leadQuality}/100. Maintain current budget and continue monitoring.`,
    confidence: 0.60,
  }
}
