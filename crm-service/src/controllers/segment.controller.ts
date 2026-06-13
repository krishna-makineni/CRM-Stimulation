import { Request, Response } from 'express';
import * as segmentService from '../services/segment.service';
import {
  segmentSchema,
  segmentParseSchema,
  segmentApproveSchema,
  segmentPreviewSchema,
} from '../middleware/validation';

export async function getSegments(_req: Request, res: Response): Promise<void> {
  const segments = await segmentService.getSegments();
  res.json(segments);
}

export async function getSegmentById(req: Request, res: Response): Promise<void> {
  const result = await segmentService.getSegmentById(req.params.id as string);
  if (!result) {
    res.status(404).json({ error: 'Segment not found' });
    return;
  }
  res.json(result);
}

export async function createSegment(req: Request, res: Response): Promise<void> {
  const data = segmentSchema.parse(req.body);
  const segment = await segmentService.createSegment(data);
  res.status(201).json(segment);
}

export async function parseNaturalLanguage(req: Request, res: Response): Promise<void> {
  const body = segmentParseSchema.parse(req.body);
  const job = await segmentService.parseNaturalLanguage(body.query, body.refinementContext);

  if (job.mode === 'inline' && 'result' in job && job.result) {
    res.json({ jobId: job.jobId, status: 'completed', ...job.result });
    return;
  }

  res.status(202).json({ jobId: job.jobId, status: 'processing' });
}

export async function getSegmentJob(req: Request, res: Response): Promise<void> {
  const result = await segmentService.getSegmentJob(req.params.jobId as string);
  if (!result) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(result);
}

export async function approveSegment(req: Request, res: Response): Promise<void> {
  const body = segmentApproveSchema.parse(req.body);
  const segment = await segmentService.approveSegment(body);
  res.status(201).json(segment);
}

export async function getSegmentInsights(req: Request, res: Response): Promise<void> {
  const result = await segmentService.getSegmentInsights(req.params.id as string);
  if (!result) {
    res.status(404).json({ error: 'Segment not found' });
    return;
  }
  res.json(result);
}

export async function previewSegment(req: Request, res: Response): Promise<void> {
  const { criteria } = segmentPreviewSchema.parse(req.body);
  const result = await segmentService.previewSegment(criteria);
  res.json(result);
}

export async function deleteSegment(req: Request, res: Response): Promise<void> {
  const segment = await segmentService.deleteSegment(req.params.id as string);
  if (!segment) {
    res.status(404).json({ error: 'Segment not found' });
    return;
  }
  res.json({ message: 'Segment deleted' });
}
