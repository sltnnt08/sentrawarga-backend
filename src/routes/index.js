import { Router } from 'express';
import { authRoutes } from './auth-routes.js';
import { notificationRoutes } from './notification-routes.js';
import { reportRoutes } from './report-routes.js';
import { wilayahRoutes } from './wilayah-routes.js';

const apiRoutes = Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/reports', reportRoutes);
apiRoutes.use('/notifications', notificationRoutes);
apiRoutes.use('/wilayah', wilayahRoutes);

export { apiRoutes };
