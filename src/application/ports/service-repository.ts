import type { Service } from '@/domain/entities/service'

export interface ServiceRepository {
  findByTenantId(tenantId: string): Promise<Service[]>
  findById(id: string): Promise<Service | null>
}
