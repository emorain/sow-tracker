'use client';

type BudgetProgressBarProps = {
  category: string;
  budgeted: number;
  actual: number;
};

export default function BudgetProgressBar({
  category,
  budgeted,
  actual,
}: BudgetProgressBarProps) {
  const percentage = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0;
  const isOverBudget = actual > budgeted;
  const remaining = budgeted - actual;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getColorClass = () => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage > 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {category}
        </span>
        <span className="text-sm text-gray-600">
          {formatCurrency(actual)} / {formatCurrency(budgeted)}
          <span className={`ml-2 text-xs ${isOverBudget ? 'text-red-600' : 'text-gray-500'}`}>
            ({percentage.toFixed(0)}%)
          </span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-500'}>
          {isOverBudget
            ? `Over by ${formatCurrency(Math.abs(remaining))}`
            : `${formatCurrency(remaining)} remaining`}
        </span>
        {percentage > 100 && (
          <span className="text-red-600 font-medium">
            {(percentage - 100).toFixed(0)}% over budget
          </span>
        )}
      </div>
    </div>
  );
}
