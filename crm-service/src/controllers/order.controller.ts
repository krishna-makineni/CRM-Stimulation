import { Request, Response } from 'express';
import * as orderService from '../services/order.service';
import { orderSchema } from '../middleware/validation';

export async function getOrders(req: Request, res: Response): Promise<void> {
  const result = await orderService.getOrders(req.query as Record<string, string>);
  res.json(result);
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const data = orderSchema.parse(req.body);
  const order = await orderService.createOrder(data);
  res.status(201).json(order);
}

export async function importOrders(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'CSV file required' });
    return;
  }
  const result = await orderService.importOrdersFromCsv(req.file.buffer);
  res.json(result);
}
