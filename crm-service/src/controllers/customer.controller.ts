import { Request, Response } from 'express';
import * as customerService from '../services/customer.service';
import { customerSchema } from '../middleware/validation';

export async function getCustomers(req: Request, res: Response): Promise<void> {
  const result = await customerService.getCustomers(req.query as Record<string, string>);
  res.json(result);
}

export async function getCustomerById(req: Request, res: Response): Promise<void> {
  const result = await customerService.getCustomerById(req.params.id as string);
  if (!result) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  res.json(result);
}

export async function createCustomer(req: Request, res: Response): Promise<void> {
  const data = customerSchema.parse(req.body);
  const customer = await customerService.createCustomer(data);
  res.status(201).json(customer);
}

export async function importCustomers(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'CSV file required' });
    return;
  }
  const result = await customerService.importCustomersFromCsv(req.file.buffer);
  res.json(result);
}
