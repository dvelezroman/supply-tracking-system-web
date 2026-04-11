/** Mirrors Prisma `ActorType` — keep in sync with `api/prisma/schema.prisma`. */
export type ActorType =
  | 'SUPPLIER'
  | 'MANUFACTURER'
  | 'WAREHOUSE'
  | 'DISTRIBUTOR'
  | 'RETAILER'
  | 'CONSUMER'
  | 'FARM'
  | 'LAB'
  | 'MATURATION'
  | 'CO_PACKER';

export const ACTOR_TYPE_LABELS: Record<ActorType, string> = {
  SUPPLIER: 'Supplier',
  MANUFACTURER: 'Manufacturer',
  WAREHOUSE: 'Warehouse',
  DISTRIBUTOR: 'Distributor',
  RETAILER: 'Retailer',
  CONSUMER: 'Consumer',
  FARM: 'Farm',
  LAB: 'Laboratory',
  MATURATION: 'Maturation',
  CO_PACKER: 'Co-packer',
};

export interface Actor {
  id: string;
  name: string;
  type: ActorType;
  location?: string;
  contact?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActorPayload {
  name: string;
  type: ActorType;
  location?: string;
  contact?: string;
  metadata?: Record<string, unknown>;
}
