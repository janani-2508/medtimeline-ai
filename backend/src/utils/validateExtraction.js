// Lightweight schema validation for the Gemini extraction response.
// Keeps the hackathon build dependency-free (no ajv) while still catching
// malformed output before it hits the database.

const REQUIRED_TOP_KEYS = ['patient', 'document', 'clinical_data', 'timeline_events'];
const CLINICAL_LIST_KEYS = ['diagnoses', 'symptoms', 'medications', 'lab_results', 'procedures', 'allergies'];

export function validateExtractionJson(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Response is not a JSON object'] };
  }

  for (const key of REQUIRED_TOP_KEYS) {
    if (!(key in data)) errors.push(`Missing top-level key: ${key}`);
  }

  if (data.clinical_data) {
    for (const key of CLINICAL_LIST_KEYS) {
      if (!Array.isArray(data.clinical_data[key])) {
        errors.push(`clinical_data.${key} must be an array`);
      }
    }
  }

  if (data.timeline_events && !Array.isArray(data.timeline_events)) {
    errors.push('timeline_events must be an array');
  }

  return { valid: errors.length === 0, errors };
}

// Attempts to parse raw Gemini text output as JSON, stripping accidental
// markdown code fences if the model added them despite instructions.
export function safeParseJson(rawText) {
  const cleaned = rawText.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}
