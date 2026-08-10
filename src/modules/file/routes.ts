import { Router } from 'express';
import { fileController } from './controllers/fileController';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { requireAuth } from '../../core/middlewares/requireAuth';
import { requestUploadSchema } from './dto/file.dto';

const fileRouter = Router();

fileRouter.use(requireAuth);

fileRouter.post('/upload-url', validateRequest(requestUploadSchema), fileController.requestUploadUrl);
fileRouter.get('/:id/download-url', fileController.requestDownloadUrl);

export default fileRouter;
