import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body === 'string' ? body : body?.prompt;
    const format = body?.format || 'plain';

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // If client requested rich formatting, prepend a system instruction
    // asking the model to return Markdown with a single-sentence summary,
    // organized bullet points / numbered lists where appropriate, and
    // markdown tables (pipes + header separator) for tabular data.
    let finalPrompt = prompt;
    if (format === 'rich') {
      const formatInstructions = `Please format your answer as Markdown using the following rules:\n\n1) Start with one concise sentence summarizing the answer.\n2) Then provide organized bullet points or numbered lists if needed for step-by-step or enumerated information.\n3) If a table is helpful, present it as a Markdown table using pipe separators and header separator lines (e.g. | Col1 | Col2 |\\n| --- | --- |).\n4) Keep the response focused and avoid unrelated commentary.\n5) Use code blocks only when necessary.\n\nRespond only with the Markdown content (no extra meta commentary).\n\nOriginal question:\n` + prompt;

      finalPrompt = formatInstructions;
    }

    // Use a server-side-only environment variable for the Gemini API key.
    // Avoid using NEXT_PUBLIC_* here so the key is not accidentally exposed to the browser.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server misconfiguration: Gemini API key missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Try common generation methods in order
    const tryModelCall = async (m: any, p: string) => {
      if (typeof m.generateContent === 'function') {
        const res = await m.generateContent(p);
        if (res?.response?.text) return res.response.text();
      }

      if (typeof m.generate === 'function') {
        const res = await m.generate({ prompt: p });
        if (res?.output?.[0]?.content) {
          const c = res.output[0].content;
          if (Array.isArray(c)) {
            const textPiece = c.find((x: any) => x?.text);
            if (textPiece) return textPiece.text;
          } else if (typeof c === 'string') {
            return c;
          }
        }
        if (res?.candidates?.[0]?.output) return res.candidates[0].output;
      }

      if (typeof m.chat === 'function') {
        const res = await m.chat({ messages: [{ role: 'user', content: p }] });
        if (res?.response?.content) {
          if (Array.isArray(res.response.content)) {
            return res.response.content.map((c: any) => c?.text || '').join('\n');
          }
          if (res.response.content.text) return res.response.content.text;
        }
      }

      if (typeof m.predict === 'function') {
        const res = await m.predict({ prompt: p });
        if (res?.text) return res.text;
      }

      throw new Error('No supported generation method found on model object');
    };

    const text = await tryModelCall(model, finalPrompt);

    return NextResponse.json({ result: text ?? '', model: MODEL_NAME });
  } catch (err: any) {
    console.error('Server AI error:', err?.message || err);
    // Try to list models for debugging
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const models = await genAI.listModels();
        console.error('Available models (server):', JSON.stringify(models, null, 2));
      }
    } catch (listErr) {
      console.error('Error listing models on server:', listErr);
    }

    return NextResponse.json({ error: err?.message || 'Unknown server error' }, { status: 500 });
  }
}
