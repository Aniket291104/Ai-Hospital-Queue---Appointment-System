import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIService } from './ai.interface';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { InternalServerError } from '../../utils/errors';

export class GeminiAIService implements IAIService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  }

  public async recommendAppointmentDetails(symptoms: string) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `
        You are an expert AI triage nurse. Analyze these symptoms: "${symptoms}".
        Based on this input, recommend:
        1. Recommended department from standard list: [Cardiology, Neurology, Pediatrics, General Medicine, Orthopedics, Dermatology, Gastroenterology, Ophthalmology]
        2. Priority level: "Regular", "Priority", or "Emergency"
        3. A brief professional explanation or reasoning.
        
        Return ONLY a JSON object matching this schema:
        {
          "recommendedDepartment": "name of department",
          "priority": "Regular/Priority/Emergency",
          "reasoning": "brief explanation"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error: any) {
      logger.error('Gemini recommendAppointmentDetails error', error);
      throw new InternalServerError('AI recommendation engine failed');
    }
  }

  public async ocrPrescriptionImage(base64Image: string) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

      const imageParts = [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        },
      ];

      const prompt = `
        Analyze this handwritten or printed prescription image. Extract all medicines listed with their details:
        1. name of medicine
        2. dosage (e.g. 500mg, 1 tablet, 5ml)
        3. timing (e.g. Morning, Night, Before Meal, After Meal, Once a day)
        4. duration (e.g. 5 days, 1 week, till needed)
        
        Return ONLY a JSON array of objects matching this schema:
        [
          {
            "name": "string",
            "dosage": "string",
            "timing": "string",
            "duration": "string"
          }
        ]
      `;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error: any) {
      logger.error('Gemini OCR error', error);
      throw new InternalServerError('Prescription OCR extraction failed');
    }
  }

  public async chatHealthAssistant(
    message: string,
    history: Array<{ role: 'user' | 'model'; content: string }>
  ) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        systemInstruction: 'You are HospitalAI Health Assistant. Help patients with basic symptoms guidance, answer FAQs, and recommend departments. Always include a disclaimer at the end that this is not medical advice.',
      });

      const chatHistory = history.map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }));

      const chat = model.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      logger.error('Gemini chatbot error', error);
      throw new InternalServerError('Health chatbot failed to respond');
    }
  }
}
