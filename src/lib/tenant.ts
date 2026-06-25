// AdScale OS — Multi-tenant Context Utility
// Extracts organization context from requests and provides scoped query helpers

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

/**
 * Extracts the organization ID from the incoming request.
 * Lookup priority:
 *   1. `x-organization-id` header
 *   2. `organization-id` cookie
 *   3. `org` query parameter
 *
 * Returns null when no organization identifier is found.
 */
export function getOrganizationId(request: NextRequest): string | null {
  // 1. Header
  const headerOrg = request.headers.get('x-organization-id')
  if (headerOrg) return headerOrg

  // 2. Cookie
  const cookieOrg = request.cookies.get('organization-id')?.value
  if (cookieOrg) return cookieOrg

  // 3. Query param
  const queryOrg = request.nextUrl.searchParams.get('org')
  if (queryOrg) return queryOrg

  return null
}

/**
 * Returns the ID of the default organization.
 * If no organization exists in the database, one is created with
 * sensible defaults and its ID is returned.
 */
export async function getOrCreateDefaultOrg(): Promise<string> {
  const firstOrg = await db.organization.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  if (firstOrg) return firstOrg.id

  // No org exists — create the default
  const defaultOrg = await db.organization.create({
    data: {
      name: 'Default Organization',
      industry: 'local_services',
      brandName: 'AdScale OS',
      slug: 'default',
      isActive: true,
    },
  })

  return defaultOrg.id
}

/**
 * Returns a Prisma-compatible `where` clause fragment scoped to
 * the given organization. Use it to ensure data isolation:
 *
 * ```ts
 * const leads = await db.lead.findMany({ where: scopeQuery(orgId) })
 * ```
 */
export function scopeQuery(organizationId: string): { organizationId: string } {
  return { organizationId }
}
