import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | 'EVENT_APPROVAL'
  | 'REFEREE_ASSIGNED'
  | 'REFEREE_ASSIGNMENT_UPDATED'
  | 'REFEREE_UNASSIGNED'
  | 'HONOR_SUBMITTED'
  | 'HONOR_VERIFIED'
  | 'HONOR_REJECTED'
  | 'HONOR_STATUS_CHANGED';

export type EntityType = 'events' | 'event_assignments' | 'honors';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string;
  actor_id: string | null;
  actor_name: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogFilters {
  entityType?: EntityType;
  entityId?: string;
  action?: AuditAction;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_logs', {
        _entity_type: filters?.entityType || null,
        _entity_id: filters?.entityId || null,
        _action: filters?.action || null,
        _actor_id: filters?.actorId || null,
        _start_date: filters?.startDate || null,
        _end_date: filters?.endDate || null,
        _limit: filters?.limit || 100,
        _offset: filters?.offset || 0,
      });

      if (error) throw error;
      return data as AuditLog[];
    },
  });
}

// Hook for entity-specific audit logs
export function useEntityAuditLogs(entityType: EntityType, entityId: string) {
  return useAuditLogs({ entityType, entityId });
}

// Helper to get human-readable action labels
export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    'EVENT_APPROVAL': 'Event Disetujui/Ditolak',
    'REFEREE_ASSIGNED': 'Wasit Ditugaskan',
    'REFEREE_ASSIGNMENT_UPDATED': 'Penugasan Diperbarui',
    'REFEREE_UNASSIGNED': 'Wasit Dibatalkan',
    'HONOR_SUBMITTED': 'Honor Diajukan',
    'HONOR_VERIFIED': 'Honor Diverifikasi',
    'HONOR_REJECTED': 'Honor Ditolak',
    'HONOR_STATUS_CHANGED': 'Status Honor Berubah',
  };
  return labels[action] || action;
}

// Helper to get action badge variant
export function getActionVariant(action: AuditAction): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (action) {
    case 'EVENT_APPROVAL':
    case 'HONOR_VERIFIED':
      return 'default';
    case 'REFEREE_ASSIGNED':
    case 'HONOR_SUBMITTED':
      return 'secondary';
    case 'REFEREE_UNASSIGNED':
    case 'HONOR_REJECTED':
      return 'destructive';
    default:
      return 'outline';
  }
}
