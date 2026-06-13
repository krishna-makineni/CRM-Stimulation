import { useNavigate } from 'react-router-dom';
import { Customer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const tierVariant: Record<string, 'default' | 'secondary' | 'warning' | 'success'> = {
  Bronze: 'secondary',
  Silver: 'default',
  Gold: 'warning',
  Platinum: 'success',
};

interface CustomerTableProps {
  customers: Customer[];
  isLoading?: boolean;
}

export function CustomerTable({ customers, isLoading }: CustomerTableProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer List</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">City</th>
                  <th className="pb-3 font-medium">Total Spend</th>
                  <th className="pb-3 font-medium">Tier</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/customers/${customer._id}`)}
                  >
                    <td className="py-3 font-medium">{customer.name}</td>
                    <td className="py-3 text-muted-foreground">{customer.email}</td>
                    <td className="py-3">{customer.city}</td>
                    <td className="py-3">{formatCurrency(customer.totalSpend)}</td>
                    <td className="py-3">
                      <Badge variant={tierVariant[customer.loyaltyTier]}>{customer.loyaltyTier}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
