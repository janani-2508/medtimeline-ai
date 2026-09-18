import { supabaseAdmin } from '../config/supabase.js';

/**
 * Converts extracted timeline_events into rows in `timeline_events`,
 * linked back to the source document for traceability.
 */
export async function generateTimelineEvents({ patientId, documentId, timelineEvents, documentDate }) {
  if (!Array.isArray(timelineEvents) || timelineEvents.length === 0) {
    return [];
  }

  const rows = timelineEvents.map(evt => ({
    patient_id: patientId,
    event_date: evt.date || documentDate || new Date().toISOString().slice(0, 10),
    event_type: evt.event_type || 'Other',
    title: evt.event_type || 'Medical Event',
    description: evt.description || '',
    source_document_id: documentId
  }));

  const { data, error } = await supabaseAdmin
    .from('timeline_events')
    .insert(rows)
    .select();

  if (error) {
    console.error('Failed to insert timeline events:', error.message);
    throw error;
  }

  return data;
}
