// Fixed JSON schema every extraction must conform to.
export const EXTRACTION_SCHEMA_EXAMPLE = {
  patient: { name: null, date_of_birth: null, patient_id: null },
  document: { document_type: null, document_date: null, hospital: null, doctor: null },
  clinical_data: {
    diagnoses: [],
    symptoms: [],
    medications: [],
    lab_results: [],
    procedures: [],
    allergies: []
  },
  timeline_events: [{ date: null, event_type: null, description: null }]
};

export function buildExtractionPrompt() {
  return `You are a medical document information extraction system.

Analyze the uploaded medical document (image or PDF) and extract ONLY information
that is explicitly present in the document. Do not invent, assume, infer, guess,
or predict any missing information. Do not add clinical interpretation, diagnosis,
or recommendations that are not written in the document.

Return the data using EXACTLY this JSON structure and nothing else — no markdown
fences, no commentary, no preamble:

${JSON.stringify(EXTRACTION_SCHEMA_EXAMPLE, null, 2)}

Rules:
- If a field is not present in the document, use null (for single values) or an
  empty array [] (for list values). Never fabricate a value.
- "date" fields must be formatted as YYYY-MM-DD if a date is present; otherwise null.
- "timeline_events" should contain one entry per distinct clinical event you can
  identify in the document (e.g. a visit, a test, a prescription), each with the
  event's own date if stated.
- Return valid JSON only, matching the schema exactly (same keys, same nesting).`;
}
