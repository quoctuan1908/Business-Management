import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import logger from 'jet-logger';
import morgan from 'morgan';
import path from 'path';

import Paths from '@src/common/constants/Paths';
import { RouteError } from '@src/common/utils/route-errors';
import BaseRouter from '@src/routes/apiRouter';
import { Pool } from 'pg';
import EnvVars, { NodeEnvs } from './common/constants/env';

/******************************************************************************
                                Setup
******************************************************************************/

export const dbPool = new Pool({
  host: EnvVars.PostgresHost,
  port: EnvVars.PostgresPort,
  user: EnvVars.PostgresUser,
  password: EnvVars.PostgresPassword,
  database: EnvVars.PostgresDb,
  
});

dbPool.connect()
  .then(() => logger.info('✅ Đã kết nối thành công với PostgreSQL!'))
  .catch((err: Error) => logger.err('❌ Lỗi kết nối PostgreSQL: ' + err.message, true));

const app = express();

// **** Middleware **** //

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Show routes called in console during development
if (EnvVars.NodeEnv === NodeEnvs.DEV) {
  app.use(morgan('dev'));
}

// Security
if (EnvVars.NodeEnv === NodeEnvs.PRODUCTION) {
  app.use(helmet());
}

// Add APIs, must be after middleware
app.use(Paths._, BaseRouter);

// Add error handler
app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (EnvVars.NodeEnv !== NodeEnvs.TEST.valueOf()) {
    logger.err(err, true);
  }
  if (err instanceof RouteError) {
    res.status(err.status).json({ error: err.message });
  }
  return next(err);
});

/******************************************************************************
                                Export default
******************************************************************************/

export default app;
