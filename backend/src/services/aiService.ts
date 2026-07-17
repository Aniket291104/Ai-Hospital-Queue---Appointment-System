import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_KEY');

// @desc    Analyze symptoms to recommend Department, Priority & Waiting reasoning
export const recommendAppointmentDetails = async (symptoms: string) => {
  if (process.env.GEMINI_API_KEY === 'MOCK_KEY' || !process.env.GEMINI_API_KEY) {
    // Return mock prediction if key is not configured
    return {
      recommendedDepartment: 'General Medicine',
      priority: 'Regular',
      reasoning: 'AI Mock: Symptoms are mild. General checkup recommended.',
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
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
  } catch (error) {
    console.error('Gemini recommendAppointmentDetails error:', error);
    throw new Error('AI recommendation failed');
  }
};

// @desc    Perform OCR on a prescription image using Gemini Vision
export const ocrPrescriptionImage = async (base64Image: string) => {
  if (process.env.GEMINI_API_KEY === 'MOCK_KEY' || !process.env.GEMINI_API_KEY) {
    return [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        timing: 'After Meal (Morning, Night)',
        duration: '3 days',
      },
    ];
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    // Remove base64 data prefix if present (e.g. data:image/jpeg;base64,)
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
  } catch (error) {
    console.error('Gemini OCR error:', error);
    throw new Error('Prescription OCR extraction failed');
  }
};

// @desc    Chat with medical disclaimer
export const chatHealthAssistant = async (message: string, history: any[] = []) => {
  if (process.env.GEMINI_API_KEY === 'MOCK_KEY' || !process.env.GEMINI_API_KEY) {
    return 'I am a simulated health assistant. Please configure the GEMINI_API_KEY to chat with me. Medical Disclaimer: This is not professional medical advice.';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chatHistory = history.map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: 'You are HospitalAI Health Assistant. Help patients with basic symptoms guidance, answer FAQs, and recommend departments. Always include a disclaimer at the end that this is not medical advice.',
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini chatbot error:', error);
    throw new Error('Health chatbot failed to respond');
  }
};
