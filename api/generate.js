// This is a Vercel Serverless Function that acts as a secure backend.

const { GoogleGenerativeAI } = require("@google/generative-ai");

// IMPORTANT: Set your GEMINI_API_KEY as an environment variable in Vercel.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = request.body;

  if (!prompt) {
    return response.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const textPrompt = `Actúa como Aria, una arquitecta y diseñadora experta de "YAN'Z SMART WOOD". La idea del cliente es: "${prompt}". Genera una descripción del concepto. Empieza presentándote ("Hola, soy Aria..."). Termina con una despedida profesional ("Espero que este concepto le inspire. Atentamente, Aria."). Formato: "Título: [Un título sofisticado]\\n\\n[Descripción con saltos de línea]"`;
    
    const textResult = await textModel.generateContent(textPrompt);
    const rawText = await textResult.response.text();

    const titleMatch = rawText.match(/Título: (.*)/);
    const title = titleMatch ? titleMatch[1].trim() : "Concepto de Diseño Personalizado";
    const description = rawText.replace(/Título: .*\n\n/, "").trim();

    // Using a reliable placeholder for the image to ensure speed and avoid timeouts on Vercel's free tier.
    const imageUrl = `https://image.pollinations.ai/prompt/professional%20interior%20design%20photo,%20photorealistic,%208k,%20${encodeURIComponent(title + ". " + prompt)}`;

    response.status(200).json({
      title,
      description,
      imageUrl,
    });

  } catch (error) {
    console.error('Error en la API de Google:', error);
    response.status(500).json({ error: 'Error al contactar los servicios de IA.' });
  }
}
