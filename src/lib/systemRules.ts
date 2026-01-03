import { supabase } from "@/integrations/supabase/client";

// Soft delete a record by setting deleted_at
export async function softDelete(
  table: 'profiles' | 'events' | 'honors' | 'event_assignments',
  id: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id);
  
  return { error: error ? new Error(error.message) : null };
}

// Restore a soft-deleted record
export async function restoreRecord(
  table: 'profiles' | 'events' | 'honors' | 'event_assignments',
  id: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null } as never)
    .eq('id', id);
  
  return { error: error ? new Error(error.message) : null };
}

// Check if user can access a region
export async function canAccessRegion(kabupatenKotaId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data } = await supabase.rpc('can_access_region', {
    _user_id: user.id,
    _kabupaten_kota_id: kabupatenKotaId,
  });
  
  return data ?? false;
}

// Validation helper for regional access
export function validateRegionalAccess(
  userKabupatenKotaId: string | null,
  targetKabupatenKotaId: string | null,
  isAdminProvinsi: boolean
): { valid: boolean; message?: string } {
  if (isAdminProvinsi) {
    return { valid: true };
  }
  
  if (targetKabupatenKotaId && userKabupatenKotaId !== targetKabupatenKotaId) {
    return { 
      valid: false, 
      message: 'Tidak dapat mengakses data wilayah lain' 
    };
  }
  
  return { valid: true };
}

// Common validation rules
export const validationRules = {
  // Name validation
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'.,-]+$/,
    message: 'Nama harus berisi 2-100 karakter alfabet',
  },
  
  // Amount validation for honors
  amount: {
    min: 0,
    max: 100000000, // 100 juta
    message: 'Jumlah harus antara 0 - 100.000.000',
  },
  
  // Date validation
  date: {
    minDate: new Date('2020-01-01'),
    maxDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
    message: 'Tanggal tidak valid',
  },
  
  // Event name validation
  eventName: {
    minLength: 5,
    maxLength: 200,
    message: 'Nama event harus berisi 5-200 karakter',
  },
};

// Helper to check if record is soft-deleted
export function isSoftDeleted(record: { deleted_at?: string | null }): boolean {
  return record.deleted_at !== null && record.deleted_at !== undefined;
}

// Format deleted_at timestamp
export function formatDeletedAt(deletedAt: string | null): string | null {
  if (!deletedAt) return null;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(deletedAt));
}
