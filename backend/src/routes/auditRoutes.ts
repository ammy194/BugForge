import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { requireAuth, requireGlobalRole } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const auditRoutes = Router();

// Audit log view requires authentication
auditRoutes.use(requireAuth);

auditRoutes.get('/', asyncHandler(AuditController.listLogs));
auditRoutes.get('/export', asyncHandler(AuditController.exportAuditTrail));
