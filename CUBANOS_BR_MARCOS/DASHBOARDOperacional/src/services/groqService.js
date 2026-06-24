const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function analyzeDocumentImage(file) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey || apiKey === 'pon_tu_api_key_de_groq_aqui') {
    throw new Error('No Groq API Key found. Please add VITE_GROQ_API_KEY to your .env file.');
  }

  // Convert file to base64
  const base64Image = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const prompt = `
  Eres un asistente de inteligencia artificial especializado en leer documentos de identidad e inmigración (como Pasaportes, CPF, CNH o RNM de Brasil).
  Analiza la imagen adjunta y extrae todos los datos personales relevantes que encuentres.
  Devuelve la respuesta ÚNICAMENTE como un objeto JSON puro (sin etiquetas markdown ni texto extra) con los siguientes campos en MAYÚSCULAS:
  - NOMBRE_COMPLETO
  - CPF
  - FECHA_NACIMIENTO (formato DD/MM/YYYY si es posible)
  - NACIONALIDAD
  - NUMERO_DOCUMENTO (si aplica, como RNM o Pasaporte)
  
  Si no encuentras un dato, omítelo o pon null.
  `;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: base64Image } }
            ]
          }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API Error:', errorData);
      throw new Error(errorData.error?.message || 'Error communicating with Groq API');
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Clean up potential markdown formatting from the AI response
    if (content.startsWith('\`\`\`json')) {
      content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    
    return JSON.parse(content);
  } catch (err) {
    console.error('Error analyzing document:', err);
    throw err;
  }
}
