import { Customer, Order } from '@/types';
import { request, uploadFile } from './client';

export const customerApi = {
  list: (search = '', limit = 10000, tier = '') => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (tier) query.append('tier', tier);
    query.append('limit', String(limit));

    return request<{ customers: Customer[]; total: number }>(`/customers?${query.toString()}`);
  },

  getById: (id: string) =>
    request<{ customer: Customer; orders: Order[] }>(`/customers/${id}`),

  importCsv: (file: File) => uploadFile('/customers/import', file),
};

export const orderApi = {
  list: (limit = 50) =>
    request<{ orders: Order[]; total: number }>(`/orders?limit=${limit}`),

  importCsv: (file: File) => uploadFile('/orders/import', file),
};
