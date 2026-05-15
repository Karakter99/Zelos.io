import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-2.5-flash';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      console.error("HATA: GEMINI_API_KEY bulunamadi!");
      return NextResponse.json({ error: "API Key eksik" }, { status: 500 });
    }

    const { question_text, correct_answer, student_answer, max_points } = await req.json();

    if (!question_text || !student_answer) {
      return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
Sen Zelos Sinav Platformu icin profesyonel bir ogretmen asistanisin.
Gorev: Ogrencinin verdigi cevabi, ogretmenin hazirladigi dogru cevapla karsilastirip adil bir puan ver.

SORU: "${question_text}"
OGRETMENIN REFERANS CEVABI: "${correct_answer || 'Belirtilmemis'}"
OGRENCININ CEVABI: "${student_answer}"
MAKSIMUM PUAN: ${max_points || 10}

Degerlendirme kriterleri:
- Cevap dogru ve eksiksizse maksimum puani ver
- Kismen dogruysa orantili puan ver
- Tamamen yanlis veya bossa 0 ver
- Dil bilgisi hatalarini fazla cezalandirma, icerigi degerlendir

SADECE bu JSON formatinda yanit ver, baska hicbir sey yazma:
{"suggested_score": 7, "reasoning": "Kisa aciklama buraya."}
    `.trim();

    console.log(`Deneniyor: ${MODEL}`);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    responseText = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsedData = JSON.parse(responseText);
    const maxPts = max_points || 10;
    parsedData.suggested_score = Math.max(0, Math.min(maxPts, parsedData.suggested_score));
    parsedData.model_used = MODEL;

    console.log(`Basarili: ${MODEL}`);
    return NextResponse.json(parsedData);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("GEMINI HATASI:", message);

    if (message.includes('API_KEY') || message.includes('403')) {
      return NextResponse.json({ error: "API Key gecersiz" }, { status: 403 });
    }
    if (message.includes('404') || message.includes('not found')) {
      return NextResponse.json({ error: "Model bulunamadi" }, { status: 404 });
    }
    if (message.includes('JSON') || message.includes('parse')) {
      return NextResponse.json({ error: "AI gecersiz format donurdtu" }, { status: 502 });
    }

    return NextResponse.json({ error: "AI puanlama basarisiz: " + message }, { status: 500 });
  }
}