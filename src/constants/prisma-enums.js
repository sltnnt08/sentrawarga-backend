export const Role = {
	USER: 'USER',
	ADMIN: 'ADMIN',
};

export const Priority = {
	LOW: 'LOW',
	NORMAL: 'NORMAL',
	HIGH: 'HIGH',
	CRITICAL: 'CRITICAL',
};

export const Category = {
	CRIMINAL: 'CRIMINAL',
	TRASH: 'TRASH',
	FLOOD: 'FLOOD',
	POLLUTION: 'POLLUTION',
	ROADS_ISSUE: 'ROADS_ISSUE',
	PUBLIC_DISTURBANCE: 'PUBLIC_DISTURBANCE',
	ACCIDENTS: 'ACCIDENTS',
};

export const ReportStatus = {
	PENDING: 'PENDING',
	VERIFIED: 'VERIFIED',
	IN_PROGRESS: 'IN_PROGRESS',
	RESOLVED: 'RESOLVED',
	REJECTED: 'REJECTED',
};

export const VoteType = {
	UP: 'UP',
	DOWN: 'DOWN',
};

export const NotificationType = {
	REPORT_STATUS_CHANGED: 'REPORT_STATUS_CHANGED',
	NEW_COMMENT: 'NEW_COMMENT',
	REPORT_RESOLVED: 'REPORT_RESOLVED',
	ADMIN_REPLY: 'ADMIN_REPLY',
};
