'use client';

export type FilterType = 'all' | 'active' | 'sows' | 'gilts' | 'bred' | 'pregnant' | 'culled' | 'sold' | 'deceased';

type FilterCounts = {
  all: number;
  active: number;
  sows: number;
  gilts: number;
  bred: number;
  pregnant: number;
  culled: number;
  sold: number;
  deceased: number;
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
  const filters: FilterType[] = ['all', 'active', 'sows', 'gilts', 'bred', 'pregnant', 'culled', 'sold', 'deceased'];

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
                ? 'bg-brand text-brand-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
          </button>
        );
      })}
    </div>
  );
}
