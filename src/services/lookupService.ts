import { supabase } from './supabaseClient';
import type { LookupCategory } from '@/types';
import { DEFAULT_LOOKUPS } from '@/data/lookups';

interface LookupRow {
  id: number;
  data: LookupCategory;
}

export async function getLookups(): Promise<LookupCategory> {
  const { data, error } = await supabase
    .from('lookups')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data) {
    return DEFAULT_LOOKUPS;
  }
  const d = (data as LookupRow).data;
  return {
    departments: d.departments ?? DEFAULT_LOOKUPS.departments,
    taskTypes: (d.taskTypes ?? DEFAULT_LOOKUPS.taskTypes) as LookupCategory['taskTypes'],
    taskStatuses: (d.taskStatuses ?? DEFAULT_LOOKUPS.taskStatuses) as LookupCategory['taskStatuses'],
    meetingTypes: (d.meetingTypes ?? DEFAULT_LOOKUPS.meetingTypes) as LookupCategory['meetingTypes'],
    meetingClassifications: (d.meetingClassifications ?? DEFAULT_LOOKUPS.meetingClassifications) as LookupCategory['meetingClassifications'],
    projectTypes: (d.projectTypes ?? DEFAULT_LOOKUPS.projectTypes) as LookupCategory['projectTypes'],
    projectStatuses: (d.projectStatuses ?? DEFAULT_LOOKUPS.projectStatuses) as LookupCategory['projectStatuses'],
  };
}

export async function updateLookups(lookups: LookupCategory): Promise<void> {
  const { error } = await supabase
    .from('lookups')
    .upsert({ id: 1, data: lookups });
  if (error) throw new Error(error.message);
}
