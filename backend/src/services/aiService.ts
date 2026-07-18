import { aiService } from './ai';

/**
 * Analyzes symptoms to recommend the best department, priority level, and reasoning.
 * @param symptoms - Symptoms description string
 */
export const recommendAppointmentDetails = async (symptoms: string) => {
  return aiService.recommendAppointmentDetails(symptoms);
};

/**
 * Performs OCR extraction on prescription images to pull out structured medicine info.
 * @param base64Image - Base64-encoded image string
 */
export const ocrPrescriptionImage = async (base64Image: string) => {
  return aiService.ocrPrescriptionImage(base64Image);
};

/**
 * Communicates with the medical chatbot assistant to answer user questions.
 * @param message - User message
 * @param history - Conversational context history
 */
export const chatHealthAssistant = async (message: string, history: any[] = []) => {
  return aiService.chatHealthAssistant(message, history);
};
