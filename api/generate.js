// Este es el "servidor" o "mayordomo" que corre en Vercel.
// Su única tarea es generar texto rápidamente para evitar timeouts.

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Lee la API Key desde las variables de entorno de Vercel.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(request, response) {
  // 1. Asegurarse de que solo se acepten peticiones POST.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = request.body;

  // 2. Validar que el prompt no esté vacío.
  if (!prompt) {
    return response.status(400).json({ error: 'La consulta no puede estar vacía.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    // 3. Crear la instrucción para la IA.
    const fullPrompt = `Actúa como Aria, una arquitecta y diseñadora experta de "YAN'Z SMART WOOD". La idea del cliente es: "${prompt}". Genera una descripción del concepto. Empieza presentándote ("Hola, soy Aria..."). Termina con una despedida profesional ("Espero que este concepto le inspire. Atentamente, Aria."). El formato DEBE ser: "Título: [Un título sofisticado]\\n\\n[Descripción con saltos de línea]"`;
    
    const result = await model.generateContent(fullPrompt);
    const rawText = await result.response.text();

    // 4. Extraer el título y la descripción de forma segura.
    const titleMatch = rawText.match(/Título: (.*)/);
    const title = titleMatch ? titleMatch[1].trim() : "Concepto de Diseño Personalizado";
    const description = rawText.replace(/Título: .*\n\n?/, "").trim();

    // 5. Enviar la respuesta final al cliente (solo texto).
    response.status(200).json({
      title,
      description,
    });

  } catch (error) {
    console.error('Error en la función de Vercel:', error);
    response.status(500).json({ error: 'Hubo un problema al comunicarse con el servicio de IA. Por favor, intente de nuevo.' });
  }
}
