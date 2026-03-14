import { Router } from 'express';
import {
	listNotificationsHandler,
	markAllNotificationsReadHandler,
	markNotificationReadHandler,
} from '../controllers/notification-controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
	listNotificationsSchema,
	markAllNotificationsReadSchema,
	notificationIdParamsSchema,
} from '../validators/notification-validator.js';

const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.get('/', validate(listNotificationsSchema), listNotificationsHandler);
notificationRoutes.patch('/read-all', validate(markAllNotificationsReadSchema), markAllNotificationsReadHandler);
notificationRoutes.patch('/:id/read', validate(notificationIdParamsSchema), markNotificationReadHandler);

export { notificationRoutes };
