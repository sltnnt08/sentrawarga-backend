import { Router } from 'express';
import {
	listDistrictsHandler,
	listProvincesHandler,
	listRegenciesHandler,
	listVillagesHandler,
} from '../controllers/wilayah-controller.js';

const wilayahRoutes = Router();

wilayahRoutes.get('/provinces.json', listProvincesHandler);
wilayahRoutes.get('/regencies/:provinceCode.json', listRegenciesHandler);
wilayahRoutes.get('/districts/:regencyCode.json', listDistrictsHandler);
wilayahRoutes.get('/villages/:districtCode.json', listVillagesHandler);

export { wilayahRoutes };
