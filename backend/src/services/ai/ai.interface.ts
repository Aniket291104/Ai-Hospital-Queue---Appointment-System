export interface IAIService {
  recommendAppointmentDetails(symptoms: string): Promise<{
    recommendedDepartment: string;
    priority: 'Regular' | 'Priority' | 'Emergency';
    reasoning: string;
  }>;
  ocrPrescriptionImage(base64Image: string): Promise<Array<{
    name: string;
    dosage: string;
    timing: string;
    duration: string;
  }>>;
  chatHealthAssistant(
    message: string,
    history: Array<{ role: 'user' | 'model'; content: string }>
  ): Promise<string>;
}
