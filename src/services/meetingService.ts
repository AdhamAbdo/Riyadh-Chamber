import { supabase } from './supabaseClient';
import type { Meeting } from '@/types';

interface MeetingRow {
  id: string;
  meeting_id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  classification: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: MeetingRow): Meeting {
  return {
    id: row.meeting_id,
    title: row.title ?? '',
    date: row.date ?? '',
    time: row.time ?? '',
    type: row.type as Meeting['type'],
    classification: row.classification as Meeting['classification'],
    notes: row.notes ?? '',
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

export async function getAllMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[meetingService] getAllMeetings:', error);
    throw new Error('حدث خطأ أثناء تحميل البيانات.');
  }
  return (data as MeetingRow[]).map(mapRow);
}

export async function getMeeting(id: string): Promise<Meeting | undefined> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('meeting_id', id)
    .maybeSingle();
  if (error) {
    console.error('[meetingService] getMeeting:', error);
    throw new Error('حدث خطأ أثناء تحميل البيانات.');
  }
  return data ? mapRow(data as MeetingRow) : undefined;
}

async function generateMeetingId(): Promise<string> {
  const { data, error } = await supabase
    .from('meetings')
    .select('meeting_id')
    .order('meeting_id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return 'MEET-00001';
  const last = (data as { meeting_id: string }).meeting_id;
  const num = parseInt(last.replace('MEET-', ''), 10) || 0;
  return `MEET-${String(num + 1).padStart(5, '0')}`;
}

export async function createMeeting(
  meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Meeting> {
  const meetingId = await generateMeetingId();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('meetings')
    .insert({
      meeting_id: meetingId,
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      type: meeting.type,
      classification: meeting.classification,
      notes: meeting.notes,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[meetingService] createMeeting:', error);
    throw new Error('حدث خطأ أثناء حفظ البيانات.');
  }
  return mapRow(data as MeetingRow);
}

export async function updateMeeting(id: string, patch: Partial<Meeting>): Promise<Meeting> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.date !== undefined) update.date = patch.date;
  if (patch.time !== undefined) update.time = patch.time;
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.classification !== undefined) update.classification = patch.classification;
  if (patch.notes !== undefined) update.notes = patch.notes;

  const { data, error } = await supabase
    .from('meetings')
    .update(update)
    .eq('meeting_id', id)
    .select('*')
    .single();
  if (error) {
    console.error('[meetingService] updateMeeting:', error);
    throw new Error('حدث خطأ أثناء حفظ البيانات.');
  }
  return mapRow(data as MeetingRow);
}

export async function deleteMeeting(id: string): Promise<void> {
  const { error } = await supabase.from('meetings').delete().eq('meeting_id', id);
  if (error) {
    console.error('[meetingService] deleteMeeting:', error);
    throw new Error('حدث خطأ أثناء حذف البيانات.');
  }
}
