import { extractionModel } from '../config/gemini.js';
import { buildExtractionPrompt } from '../prompts/extractionPrompt.js';
import { validateExtractionJson, safeParseJson } from '../utils/validateExtraction.js';

const MAX_ATTEMPTS = 2;

/**
 * Sends the document (as base64) to Gemini for structured extraction.
 * Retries once on invalid JSON / schema mismatch, then gives up.
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @returns {{success:boolean, data?:object, errors?:string[]}}
 */
export async function extractMedicalData(fileBuffer, mimeType) {
  const prompt = buildExtractionPrompt();
  const base64Data = fileBuffer.toString('base64');

  let lastErrors = [];

  const MAX_ATTEMPTS = 4;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    const result = await extractionModel.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      { text: prompt }
    ]);

    const rawText = result.response.text();
    const parsed = safeParseJson(rawText);
    const { valid, errors } = validateExtractionJson(parsed);

    if (valid) {
      return { success: true, data: parsed };
    }

    lastErrors = errors;
    console.warn(
      `Extraction attempt ${attempt} failed validation:`,
      errors
    );

  } catch (err) {
    lastErrors = [err.message];

    console.warn(
      `Extraction attempt ${attempt} failed:`,
      err.message
    );

    // Retry only temporary Gemini errors
    const isTemporaryError =
      err.message.includes("503") ||
      err.message.includes("429") ||
      err.message.includes("Service Unavailable") ||
      err.message.includes("high demand");

    if (isTemporaryError && attempt < MAX_ATTEMPTS) {
      const delay = 2000 * Math.pow(2, attempt - 1);

      console.log(
        `Gemini temporarily unavailable. Retrying in ${
          delay / 1000
        } seconds...`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    } else if (!isTemporaryError) {
      break;
    }
  }
}

return { success: false, errors: lastErrors };}