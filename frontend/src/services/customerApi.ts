import { Customer, Order } from '@/types';
import { request, uploadFile } from './client';

export const customerApi = {
  list: (search = '', limit = 50) =>
    request<{ customers: Customer[]; total: number }>(`/customers?search=${search}&limit=${limit}`),

  getById: (id: string) =>
    request<{ customer: Customer; orders: Order[] }>(`/customers/${id}`),

  importCsv: (file: File) => uploadFile('/customers/import', file),
};

export const orderApi = {
  list: (limit = 50) =>
    request<{ orders: Order[]; total: number }>(`/orders?limit=${limit}`),

  importCsv: (file: File) => uploadFile('/orders/import', file),
};
