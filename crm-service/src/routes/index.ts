import { Router } from 'express';
import customerRoutes from './customer.routes';
import orderRoutes from './order.routes';
import segmentRoutes from './segment.routes';
import campaignRoutes from './campaign.routes';
import analyticsRoutes from './analytics.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/segments', segmentRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/webhooks', webhookRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'crm', timestamp: new Date().toISOString() });
});

export default router;
