import { Actor } from './actor.model';
import { Product } from './product.model';

export type EventType =
  | 'CREATED'
  | 'HARVESTED'
  | 'TRANSPORTED'
  | 'RECEIVED'
  | 'QUALITY_CHECKED'
  | 'PROCESSED'
  | 'PACKAGED'
  | 'STORED'
  | 'SHIPPED'
  | 'SOLD'
  | 'DELIVERED'
  | 'INSPECTED';

export const EVENT_TYPE_LABELS: Record<string, string> = {
  CREATED: 'Created',
  HARVESTED: 'Harvested',
  TRANSPORTED: 'Transported',
  RECEIVED: 'Received',
  QUALITY_CHECKED: 'Quality checked',
  PROCESSED: 'Processed',
  PACKAGED: 'Packaged',
  SHIPPED: 'Shipped',
  STORED: 'Stored',
  INSPECTED: 'Inspected',
  SOLD: 'Sold',
  DELIVERED: 'Delivered',
};

export const EVENT_TYPE_COLORS: Record<string, 'primary' | 'accent' | 'warn'> = {
  CREATED: 'primary',
  HARVESTED: 'primary',
  TRANSPORTED: 'accent',
  RECEIVED: 'accent',
  QUALITY_CHECKED: 'accent',
  PROCESSED: 'primary',
  PACKAGED: 'accent',
  SHIPPED: 'accent',
  STORED: 'primary',
  INSPECTED: 'accent',
  SOLD: 'warn',
  DELIVERED: 'primary',
};

/** Matches API `EventType` enum — filter dropdown order. */
export const TRACEABILITY_FILTER_EVENT_TYPES: readonly EventType[] = [
  'CREATED',
  'HARVESTED',
  'TRANSPORTED',
  'RECEIVED',
  'QUALITY_CHECKED',
  'PROCESSED',
  'PACKAGED',
  'STORED',
  'SHIPPED',
  'SOLD',
  'DELIVERED',
];

export interface TraceabilityEvent {
  id: string;
  productId: string;
  actorId: string;
  eventType: EventType;
  location?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  product?: Product;
  actor?: Actor;
}

export interface CreateEventPayload {
  productId: string;
  actorId: string;
  eventType: EventType;
  location?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}
