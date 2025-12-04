'use client';

export type FilterType = 'all' | 'active' | 'sows' | 'gilts' | 'bred' | 'pregnant' | 'culled' | 'sold';

type FilterCounts = {
  all: number;
  active: number;
  sows: number;
  gilts: number;
  bred: number;
  pregnant: number;
  culled: number;
  sold: number;
};

type FilterTabsProps = {
  activeFilter: FilterType;
  filterCounts: FilterCounts;
  onFilterChange: (filter: FilterType) => void;
  loading?: boolean;
};

export default function FilterTabs({
  activeFilter,
  filterCounts,
  onFilterChange,
  loading = false,
}: FilterTabsProps) {
  const filters: FilterType[] = ['all', 'active', 'sows', 'gilts', 'bred', 'pregnant', 'culled', 'sold'];

  if (loading) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
      {filters.map((filter) => {
        const count = filterCounts[filter];
        const isActive = activeFilter === filter;

        return (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-red-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
          </button>
        );
      })}
    </div>
  );
}
