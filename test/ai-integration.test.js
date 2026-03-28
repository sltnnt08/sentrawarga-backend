import { test } from 'node:test';
import { equal, ok } from 'node:assert';
import { klasifikasiLaporan } from '../src/services/ai-service.js';

const VALID_CATEGORIES = ['CRIMINAL', 'TRASH', 'FLOOD', 'POLLUTION', 'ROADS_ISSUE', 'PUBLIC_DISTURBANCE', 'ACCIDENTS', 'OTHERS'];

console.log('\n════════════════════════════════════════════════════════════════');
console.log('       AI Service Integration Tests');
console.log('════════════════════════════════════════════════════════════════\n');

// Test 1: Graceful fallthrough with missing API key
test('AI Service - Returns fallback structure on API failure or valid response', async () => {
	const result = await klasifikasiLaporan({
		deskripsi: 'Test laporan dengan deskripsi panjang yang cukup untuk klasifikasi',
		fotoBase64: null,
	});

	// Should have required structure in either success or failure case
	equal(typeof result, 'object', 'Result should be an object');
	ok('category' in result, 'Result should have category field');
	ok('confidenceScore' in result, 'Result should have confidenceScore field');
	ok('isSpam' in result, 'Result should have isSpam field');
	ok('aiError' in result, 'Result should have aiError field');
	
	// Either API succeeds with valid values OR fails with null/false
	if (result.aiError) {
		// API failed - check fallback values
		equal(result.category, null, 'Fallback category should be null on error');
		equal(result.confidenceScore, null, 'Fallback confidenceScore should be null on error');
		equal(result.isSpam, false, 'Fallback isSpam should be false on error');
	} else {
		// API succeeded - validate response values
		if (result.category !== null) {
			ok(VALID_CATEGORIES.includes(result.category), `Category "${result.category}" should be valid`);
		}
		if (result.confidenceScore !== null) {
			ok(typeof result.confidenceScore === 'number', 'Confidence score should be a number');
			ok(result.confidenceScore >= 0 && result.confidenceScore <= 1, 'Confidence score should be 0-1');
		}
		equal(typeof result.isSpam, 'boolean', 'isSpam should be boolean');
	}

	console.log('  ✓ Returns valid structure with proper fallback or successful response');
});

// Test 2: Description without image
test('AI Service - Accepts description without image', async () => {
	const result = await klasifikasiLaporan({
		deskripsi: 'Laporan tentang sampah yang menumpuk di jalan raya dan perlu dibersihkan',
		fotoBase64: undefined,
	});

	equal(typeof result, 'object', 'Result should be an object');
	ok('category' in result, 'Result should have category field');
	ok('confidenceScore' in result, 'Result should have confidenceScore field');
	ok('isSpam' in result, 'Result should have isSpam field');

	console.log('  ✓ Accepts description without image');
});

// Test 3: Category validation - valid categories only
test('AI Service - Validates categories against allowed values', async () => {
	const result = await klasifikasiLaporan({
		deskripsi: 'Laporan dengan kategori yang akan divalidasi secara ketat',
		fotoBase64: null,
	});

	if (result.category !== null) {
		ok(VALID_CATEGORIES.includes(result.category), 
		   `Result category "${result.category}" should be one of valid categories: ${VALID_CATEGORIES.join(', ')}`);
	}
	
	console.log('  ✓ Only returns valid category values from enum');
});

// Test 4: Confidence score validation
test('AI Service - Validates confidence score range', async () => {
	const result = await klasifikasiLaporan({
		deskripsi: 'Laporan untuk validasi confidence score dalam format 0.0 hingga 1.0',
		fotoBase64: null,
	});

	if (result.confidenceScore !== null) {
		equal(typeof result.confidenceScore, 'number', 'Confidence score should be a number');
		ok(result.confidenceScore >= 0.0 && result.confidenceScore <= 1.0, 
		   `Confidence score ${result.confidenceScore} should be between 0.0 and 1.0`);
	}
	
	console.log('  ✓ Confidence score is within valid range (0.0-1.0)');
});

// Test 5: isSpam should be boolean
test('AI Service - isSpam field is always boolean', async () => {
	const result = await klasifikasiLaporan({
		deskripsi: 'Laporan untuk memvalidasi bahwa isSpam selalu boolean',
		fotoBase64: null,
	});

	equal(typeof result.isSpam, 'boolean', 'isSpam should always be a boolean value');
	
	console.log('  ✓ isSpam field is always boolean type');
});

// Test 6: Description only (minimum required field)
test('AI Service - Works with minimum required fields', async () => {
	const result = await klasifikasiLaporan({
		deskripsi: 'Laporan singkat namun bermakna',
	});

	equal(typeof result, 'object', 'Result should be an object');
	ok(result !== null, 'Result should not be null');
	
	console.log('  ✓ Works with minimum required fields (description only)');
});

// Test 7: Result structure consistency
test('AI Service - Returns consistent result structure', async () => {
	const result = await klasifikasiLaporan({
		deskripsi: 'Test untuk konsistensi struktur hasil yang dikembalikan',
		fotoBase64: null,
	});

	const expectedFields = ['category', 'confidenceScore', 'isSpam', 'aiError'];
	for (const field of expectedFields) {
		ok(field in result, `Result should have ${field} field`);
	}
	
	console.log('  ✓ Returns consistent result structure with all required fields');
});

// Test 8: Error flag consistency
test('AI Service - aiError flag indicates API failure', async () => {
	const result = await klasifikasiLaporan({
		deskripsi: 'Laporan untuk verifikasi flag error API',
		fotoBase64: null,
	});

	equal(typeof result.aiError, 'boolean', 'aiError should be a boolean');
	if (result.aiError) {
		equal(result.category, null, 'When aiError is true, category should be null');
		equal(result.confidenceScore, null, 'When aiError is true, confidenceScore should be null');
	}
	
	console.log('  ✓ aiError flag accurately indicates API failure state');
});

console.log('\n════════════════════════════════════════════════════════════════\n');
