import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AuditService } from '../services/auditService';

export class AuditController {
  /**
   * GET /api/v1/audit
   */
  static async listLogs(req: Request, res: Response) {
    const { action, actor, search, limit, offset } = req.query;

    const result = AuditService.listLogs({
      action: typeof action === 'string' ? action : undefined,
      actor: typeof actor === 'string' ? actor : undefined,
      search: typeof search === 'string' ? search : undefined,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    return ApiResponse.success({
      res,
      data: result.logs,
      meta: {
        total: result.total,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      },
      message: 'Audit logs retrieved',
    });
  }

  /**
   * GET /api/v1/audit/export
   */
  static async exportAuditTrail(req: Request, res: Response) {
    const { format } = req.query;

    if (format === 'csv') {
      const csvData = AuditService.exportAuditCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="bugforge-security-audit-trail.csv"');
      return res.status(200).send(csvData);
    }

    const { logs } = AuditService.listLogs({ limit: 1000 });
    return ApiResponse.success({
      res,
      data: logs,
      message: 'Audit trail JSON export',
    });
  }
}
