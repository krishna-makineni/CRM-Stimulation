import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

router.get('/dashboard', asyncHandler(analyticsController.getDashboard));
router.get('/insights', asyncHandler(analyticsController.getInsights));
router.get('/comparison', asyncHandler(analyticsController.getComparison));
router.get('/channels', asyncHandler(analyticsController.getChannels));

export default router;
