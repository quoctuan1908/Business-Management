import { Router } from 'express';

import Paths from '@src/common/constants/Paths';

import UserRoutes from './UserRoutes';
import AuthRoutes from './AuthRoutes';
import authMiddleware from '@src/middlewares/authMiddleware';

/******************************************************************************
                                Setup
******************************************************************************/

const apiRouter = Router();

// ----------------------- Add UserRouter --------------------------------- //

const userRouter = Router();

userRouter.use(authMiddleware.auth);

userRouter.get(Paths.Users.Get, UserRoutes.getAll);
userRouter.post(Paths.Users.Add, UserRoutes.add);
userRouter.put(Paths.Users.Update, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, UserRoutes.delete);

apiRouter.use(Paths.Users._, userRouter);

// ----------------------- Add AuthRouter --------------------------------- //

const authRouter = Router();

authRouter.post(Paths.Auth.Login, AuthRoutes.login);
authRouter.get(Paths.Auth.Refresh, AuthRoutes.refresh);
authRouter.get(Paths.Auth.Logout, AuthRoutes.logout);
authRouter.post(Paths.Auth.Register, AuthRoutes.register)

apiRouter.use(Paths.Auth._, authRouter);

/******************************************************************************
                                Export
******************************************************************************/

export default apiRouter;
