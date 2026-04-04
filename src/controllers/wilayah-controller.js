import { getWilayahData } from '../services/wilayah-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const sendWilayahResponse = async (res, resource, code = null) => {
	const payload = await getWilayahData({ resource, code });

	res.json({
		success: true,
		message: 'Wilayah data fetched',
		data: payload.data,
	});
};

export const listProvincesHandler = asyncHandler(async (req, res) => {
	await sendWilayahResponse(res, 'provinces');
});

export const listRegenciesHandler = asyncHandler(async (req, res) => {
	await sendWilayahResponse(res, 'regencies', req.params.provinceCode);
});

export const listDistrictsHandler = asyncHandler(async (req, res) => {
	await sendWilayahResponse(res, 'districts', req.params.regencyCode);
});

export const listVillagesHandler = asyncHandler(async (req, res) => {
	await sendWilayahResponse(res, 'villages', req.params.districtCode);
});
