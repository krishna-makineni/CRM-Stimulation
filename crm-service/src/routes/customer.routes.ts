import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/errorHandler';
import * as customerController from '../controllers/customer.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', asyncHandler(customerController.getCustomers));
router.get('/:id', asyncHandler(customerController.getCustomerById));
router.post('/', asyncHandler(customerController.createCustomer));
router.post('/import', upload.single('file'), asyncHandler(customerController.importCustomers));

export default router;
