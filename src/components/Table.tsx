import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function Table<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto -mx-4 md:mx-0">
      <div className="inline-block min-w-full align-middle px-4 md:px-0">
        <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 md:px-6 py-3 md:py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {column.render ? column.render(item) : (item[column.key] as React.ReactNode)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
