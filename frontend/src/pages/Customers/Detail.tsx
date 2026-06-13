import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { customerApi } from '@/services/customerApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!data) return <p>Customer not found</p>;

  const { customer, orders } = data;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/customers')}>
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground mt-1">{customer.email}</p>
        </div>
        <Badge variant="success">{customer.loyaltyTier}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{customer.phone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">City</p>
            <p className="font-medium">{customer.city}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spend</p>
            <p className="font-medium text-lg">{formatCurrency(customer.totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Member Since</p>
            <p className="font-medium">{formatDate(customer.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">{order.products.join(', ')}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.orderDate)}</p>
                </div>
                <p className="font-semibold">{formatCurrency(order.orderAmount)}</p>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
