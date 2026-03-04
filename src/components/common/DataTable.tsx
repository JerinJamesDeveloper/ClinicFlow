// src/components/common/DataTable.tsx
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

function DataTable<T extends { id: number }>({
  columns,
  data,
  loading,
  pagination,
}: DataTableProps<T>) {
  const totalPages = pagination
    ? Math.ceil(pagination.totalItems / pagination.pageSize)
    : 1;

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
          <p className="mt-4 text-surface-500">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-surface-500 font-medium">No data available</p>
          <p className="text-surface-400 text-sm mt-1">No records found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-200">
          <thead className="table-header">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-4 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-surface-100">
            {data.map((row, rowIndex) => (
              <tr 
                key={row.id} 
                className="table-row"
                style={{ animationDelay: `${rowIndex * 30}ms` }}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap">
                    {column.render
                      ? column.render(row[column.key as keyof T], row)
                      : String(row[column.key as keyof T] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-surface-100 bg-surface-50/50">
          <div className="text-sm text-surface-500">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
            <span className="font-medium text-surface-700">{pagination.totalItems}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-surface-200 text-surface-500 hover:bg-white hover:border-surface-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={`min-w-[2.5rem] h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pagination.currentPage === pageNum
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                        : 'text-surface-600 hover:bg-white hover:border-surface-300 border border-transparent'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === totalPages}
              className="p-2 rounded-lg border border-surface-200 text-surface-500 hover:bg-white hover:border-surface-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
