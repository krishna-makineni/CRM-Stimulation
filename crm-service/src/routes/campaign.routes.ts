import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as campaignController from '../controllers/campaign.controller';

const router = Router();

router.get('/', asyncHandler(campaignController.getCampaigns));
router.post('/', asyncHandler(campaignController.createCampaign));
router.get('/jobs/:jobId', asyncHandler(campaignController.getCampaignJobStatus));
router.post('/generate-message', asyncHandler(campaignController.generateMessage));
router.post('/recommend-channel', asyncHandler(campaignController.recommendChannelHandler));
router.post('/copilot/sessions', asyncHandler(campaignController.startCopilotSession));
router.get('/copilot/sessions/:sessionId', asyncHandler(campaignController.getCopilotSession));
router.post('/copilot/sessions/:sessionId/messages', asyncHandler(campaignController.sendCopilotMessage));
router.get('/:id', asyncHandler(campaignController.getCampaignById));
router.put('/:id', asyncHandler(campaignController.updateCampaign));
router.post('/:id/launch', asyncHandler(campaignController.launchCampaignHandler));
router.post('/:id/preview', asyncHandler(campaignController.getMessagePreviewHandler));

export default router;
