import {
	listNotifications,
	markAllNotificationsRead,
	markNotificationRead,
} from '../services/notification-service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const listNotificationsHandler = asyncHandler(async (req, res) => {
	const result = await listNotifications(req.user.id, req.validated.query);
	res.json({
		success: true,
		data: result,
	});
});

export const markNotificationReadHandler = asyncHandler(async (req, res) => {
	const notification = await markNotificationRead(req.user.id, req.validated.params.id);
	res.json({
		success: true,
		message: 'Notification marked as read',
		data: notification,
	});
});

export const markAllNotificationsReadHandler = asyncHandler(async (req, res) => {
	const result = await markAllNotificationsRead(req.user.id);
	res.json({
		success: true,
		message: 'All notifications marked as read',
		data: result,
	});
});
