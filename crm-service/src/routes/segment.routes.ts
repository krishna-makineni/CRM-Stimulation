import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as segmentController from '../controllers/segment.controller';

const router = Router();

router.get('/', asyncHandler(segmentController.getSegments));
router.post('/', asyncHandler(segmentController.createSegment));
router.post('/parse', asyncHandler(segmentController.parseNaturalLanguage));
router.post('/approve', asyncHandler(segmentController.approveSegment));
router.post('/preview', asyncHandler(segmentController.previewSegment));
router.get('/jobs/:jobId', asyncHandler(segmentController.getSegmentJob));
router.get('/:id/insights', asyncHandler(segmentController.getSegmentInsights));
router.get('/:id', asyncHandler(segmentController.getSegmentById));
router.delete('/:id', asyncHandler(segmentController.deleteSegment));

export default router;
