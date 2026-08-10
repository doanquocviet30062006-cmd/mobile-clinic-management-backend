import { Router } from 'express';
import { authController } from './controllers/authController';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { registerSchema, loginSchema, refreshSchema } from './dto/auth.dto';

const authRouter = Router();

authRouter.post('/register', validateRequest(registerSchema), authController.register);
authRouter.post('/login', validateRequest(loginSchema), authController.login);
authRouter.post('/refresh', validateRequest(refreshSchema), authController.refresh);
authRouter.post('/logout', validateRequest(refreshSchema), authController.logout);

export default authRouter;
