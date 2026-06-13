import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/errorHandler';
import * as orderController from '../controllers/order.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', asyncHandler(orderController.getOrders));
router.post('/', asyncHandler(orderController.createOrder));
router.post('/import', upload.single('file'), asyncHandler(orderController.importOrders));

export default router;
