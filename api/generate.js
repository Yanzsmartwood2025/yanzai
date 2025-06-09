// Importa la librería oficial de Google
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuración de la API
export const config = {
  runtime: 'edge', // Usa el runtime de Vercel para máxima velocidad
};

// Esta es la función principal que se ejecuta cuando se llama a /api/generate
export default async function handler(req) {
  try {
    // 1. Leer la llave secreta desde las variables de entorno de Vercel
    //    Esta es la parte más importante y la que probablemente está fallando.
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    // 2. Obtener el prompt que envió el usuario desde la página web
    const { prompt } = await req.json();

    // Si no hay prompt, devuelve un error
    if (!prompt) {
      return new Response(JSON.stringify({ error: "No se recibió ningún prompt." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Preparar y llamar al modelo de IA de Google
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    // El prompt que le damos a la IA, diciéndole cómo debe comportarse
    const fullPrompt = `
      Eres "Aria", una experta asesora de diseño de interiores para la empresa "YAN'Z SMART WOOD", especializada en muebles de madera de alta gama.
      Un cliente ha descrito su visión: "${prompt}".

      Tu tarea es responder con un título inspirador y una descripción detallada.
      La descripción debe presentar el concepto de forma atractiva y profesional, mencionando materiales, paleta de colores, iluminación y tipos de muebles, destacando siempre la elegancia y la calidad de la madera.
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // 4. Procesar la respuesta de la IA para enviarla como JSON
    //    Asumimos que la IA devuelve el título en la primera línea.
    const lines = text.split('\n');
    const title = lines[0].replace('Título: ', '').trim();
    const description = lines.slice(1).join('\n').trim();

    // 5. Devolver el resultado a la página web
    return new Response(JSON.stringify({ title, description }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // 6. Si algo sale mal, imprime el error en los logs de Vercel y avisa al usuario
    console.error("Error en la función de Vercel:", error);
    return new Response(JSON.stringify({ error: "Hubo un error al contactar a la IA." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
