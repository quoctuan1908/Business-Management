import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import BackupService from '@src/services/BackupService';

import { Req, Res } from './common/express-types';

async function exportBackup(_: Req, res: Res) {
  const { filename, content } = await BackupService.exportBackup();

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(HttpStatusCodes.OK).send(content);
}

async function restore(req: Req, res: Res) {
  const backup = req.body?.backup ?? req.body;
  const result = await BackupService.restoreBackup(backup);

  res.status(HttpStatusCodes.OK).json({
    message: 'Phục hồi dữ liệu thành công',
    restoredAt: result.restoredAt,
  });
}

export default {
  exportBackup,
  restore,
} as const;
