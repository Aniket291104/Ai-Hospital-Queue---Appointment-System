import { IAIService } from './ai.interface';

export class MockAIService implements IAIService {
  public async recommendAppointmentDetails(symptoms: string) {
    return {
      recommendedDepartment: 'General Medicine',
      priority: 'Regular' as const,
      reasoning: `AI Mock: Symptoms are mild. General checkup recommended. (Analysed: "${symptoms.substring(0, 60)}")`,
    };
  }

  public async ocrPrescriptionImage(base64Image: string) {
    return [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        timing: 'After Meal (Morning, Night)',
        duration: '3 days',
      },
    ];
  }

  public async chatHealthAssistant(
    message: string,
    history: Array<{ role: 'user' | 'model'; content: string }>
  ) {
    return `[Mock Response] I am a simulated health assistant. Please configure a valid GEMINI_API_KEY in your environment to talk to the real Gemini model. Disclaimer: This is not professional medical advice. (Message processed: "${message.substring(0, 100)}")`;
  }
}
