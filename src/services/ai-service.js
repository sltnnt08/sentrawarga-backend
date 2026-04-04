import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

const VALID_CATEGORIES = [
	'CRIMINAL',
	'TRASH',
	'FLOOD',
	'POLLUTION',
	'ROADS_ISSUE',
	'PUBLIC_DISTURBANCE',
	'ACCIDENTS',
	'OTHERS',
];

async function klasifikasiLaporan({
	judul,
	deskripsi,
	fotoBase64,
	mimeType = 'image/jpeg',
}) {
	const fallback = {
		category: null,
		confidenceScore: null,
		isSpam: false,
		aiError: true,
	};

	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

		const prompt = `Kamu adalah sistem klasifikasi laporan masalah lingkungan.
        Analisis laporan berikut dan kembalikan JSON dengan format ini:
        {
          "category": "<salah satu: CRIMINAL | TRASH | ROADS_ISSUE | POLLUTION | FLOOD | PUBLIC_DISTURBANCE | ACCIDENTS | OTHERS>",
          "confidence": <angka 0.0 sampai 1.0>,
          "isSpam": <true jika laporan tidak relevan/palsu, false jika legitimate>
        }
        Hanya kembalikan JSON, tanpa penjelasan tambahan.

				Judul laporan: "${judul || ''}"
        
        Deskripsi laporan: "${deskripsi}"`;

		const parts = [{ text: prompt }];

		if (fotoBase64) {
			parts.push({
				inlineData: { mimeType, data: fotoBase64 },
			});
		}

		const result = await model.generateContent(parts);
		const text = result.response.text().trim();

		// hapus markdown code block kalo ada
		const clean = text.replace(/```json|```/g, '').trim();
		const parsed = JSON.parse(clean);

		// Validate output
		if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = 'OTHERS';
		if (typeof parsed.confidence !== 'number') parsed.confidence = 0.5;
		const isSpam = parsed.isSpam === true;

		return {
			category: parsed.category,
			confidenceScore: parsed.confidence,
			isSpam,
			aiError: false,
		};
	} catch (err) {
		console.error('AI Service error:', err.message);
		return fallback; // Report is still saved even if AI fails
	}
}

export { klasifikasiLaporan };
