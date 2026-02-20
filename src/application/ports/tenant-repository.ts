import type { Tenant } from '@/domain/entities/tenant'

export interface TenantRepository {
  findBySlug(slug: string): Promise<Tenant | null>
  findById(id: string): Promise<Tenant | null>
  findByOwnerId(ownerId: string): Promise<Tenant | null>
  save(tenant: Tenant): Promise<Tenant>
}
