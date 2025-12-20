'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

type FinancialSummaryCardProps = {
  title: string;
  amount: number;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendPercent?: number;
  colorScheme?: 'green' | 'red' | 'blue' | 'default';
  subtitle?: string;
};

export default function FinancialSummaryCard({
  title,
  amount,
  icon: Icon,
  trend,
  trendPercent,
  colorScheme = 'default',
  subtitle,
}: FinancialSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'green':
        return {
          icon: 'text-green-600',
          amount: 'text-green-600',
          bg: 'bg-green-50',
        };
      case 'red':
        return {
          icon: 'text-red-600',
          amount: 'text-red-600',
          bg: 'bg-red-50',
        };
      case 'blue':
        return {
          icon: 'text-blue-600',
          amount: 'text-blue-600',
          bg: 'bg-blue-50',
        };
      default:
        return {
          icon: 'text-gray-600',
          amount: 'text-gray-900',
          bg: 'bg-gray-50',
        };
    }
  };

  const colors = getColorClasses();

  const getTrendColor = () => {
    if (!trend) return '';
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-full ${colors.bg}`}>
          <Icon className={`h-4 w-4 ${colors.icon}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colors.amount}`}>
          {formatCurrency(amount)}
        </div>
        {(trend && trendPercent !== undefined) && (
          <p className={`text-xs ${getTrendColor()} mt-1 flex items-center gap-1`}>
            <span>{trend === 'up' ? '↑' : '↓'}</span>
            <span>{Math.abs(trendPercent)}%</span>
            <span className="text-gray-500">from last period</span>
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
