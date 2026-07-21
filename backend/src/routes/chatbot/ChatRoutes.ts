// routes/ChatRoutes.ts
import { NextFunction } from 'express';
import GeminiToolsService from '@src/toolsServices/gemini-tools'
import { ISessionUser, ToolContext } from '@src/models/common/types';
import { Req, Res } from '../common/express-types';

interface ChatCompleteBody {
  message: string;
  history?: any[];
}

async function complete(req: Req, res: Res, next: NextFunction) {
  try {
    const { message, history } = req.body as unknown as ChatCompleteBody;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message là bắt buộc và phải là chuỗi' });
    }

    const ctx: ToolContext = {
      sessionUser: res.locals.sessionUser as ISessionUser,
    };

    const answer = await GeminiToolsService.chat(message, history ?? [], ctx);

    return res.json({ answer });
  } catch (error) {
    return next(error);
  }
}

export default { complete };