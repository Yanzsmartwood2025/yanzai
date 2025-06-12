import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuración para que funcione en Vercel
export const config = {
  runtime: 'edge',
};

// Esta es la función principal que se ejecuta cuando la llamas desde tu página
export default async function handler(req) {
  // Solo permitir peticiones de tipo POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Conectar a la IA usando tu llave secreta de Vercel
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const body = await req.json();
    const { prompt, task, title, description } = body;

    if (!task) {
        throw new Error("No se especificó una tarea.");
    }
    
    // TAREA: Generar un concepto completo (Texto + Imagen)
    if (task === 'full_generation') {
        if (!prompt) throw new Error("No se recibió ningún prompt.");

        // Paso A: Filtro de seguridad
        const moderationModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const moderationPrompt = `Does the following prompt relate to interior/exterior design, furniture (like for kitchens, TVs), materials (like wood, synthetic floors, ceramic, granite), or construction elements (like gypsum, lighting, electricity)? Answer only with "yes" or "no". Unrelated topics are things like people, animals, characters, or specific objects not related to home design.\n\nPrompt: "${prompt}"`;
        const moderationResult = await moderationModel.generateContent(moderationPrompt);
        const moderationResponse = await moderationResult.response;
        const answer = moderationResponse.text().trim().toLowerCase();

        if (!answer.includes('yes')) {
            return new Response(JSON.stringify({ type: 'safety_violation' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // Paso B: Generar la descripción y el título
        const textModel = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            systemInstruction: `Eres "Aria", una experta asesora de diseño de interiores para "YAN'Z SMART WOOD". Tu especialidad es la madera inteligente y el diseño moderno. Tu objetivo es inspirar a los clientes. Responde con un objeto JSON con "title" (máx. 5 palabras) y "description" (3-5 frases sobre ambiente, materiales, iluminación y muebles).`,
        });
        const textGenerationResult = await textModel.generateContent(prompt);
        const textResponse = await textGenerationResult.response;
        const textResult = JSON.parse(textResponse.text());

        // Paso C: Generar la imagen con FX
        const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });
        const imagePrompt = `Fotografía profesional de diseño de interiores con efectos visuales cinematográficos, 8k, fotorrealista. Concepto: "${textResult.title}". Estilo: ${prompt}. Descripción: ${textResult.description}`;
        const imageGenerationResult = await imageModel.generateContent(imagePrompt);
        const imageResponse = await imageGenerationResult.response;
        const imageResult = imageResponse.candidates[0].content.parts[0].text;
        
        return new Response(JSON.stringify({ type: 'success', textResult, imageResult }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // TAREA: Regenerar la imagen con nuevos FX
    if (task === 'image_regeneration') {
        if (!prompt) throw new Error("No se recibió ningún prompt para regenerar imagen.");
        const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });
        const imageGenerationResult = await imageModel.generateContent(prompt);
        const imageResponse = await imageGenerationResult.response;
        const imageResult = imageResponse.candidates[0].content.parts[0].text;
        
        return new Response(JSON.stringify({ type: 'success', imageResult }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // TAREA: Obtener las ideas de YAN'Z
    if (task === 'get_details') {
        if (!title || !description) throw new Error("Faltan datos para obtener detalles.");
        const detailsModel = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
        });
        const detailsPrompt = `Basado en el concepto de diseño "${title}" (${description}), genera una lista de sugerencias concretas. Responde con un objeto JSON con tres propiedades: "materials" (array de 3-4 materiales específicos, incluyendo tipos de madera de YAN'Z SMART WOOD), "furniture" (array de 3-4 piezas de mobiliario clave), y "palette" (array de 4 objetos de color, cada uno con "name" y "hex").`;
        const detailsGenerationResult = await detailsModel.generateContent(detailsPrompt);
        const detailsResponse = await detailsGenerationResult.response;
        const details = JSON.parse(detailsResponse.text());

        return new Response(JSON.stringify({ type: 'success', details }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Si la tarea no es reconocida
    throw new Error("Tarea no reconocida.");

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
