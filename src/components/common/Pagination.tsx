import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(1, page), Math.max(1, totalPages));
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages: Array<number | '...'> = [];

  if (totalPages <= 7) {
    for (let p = 1; p <= totalPages; p++) pages.push(p);
    return pages;
  }

  pages.push(1);

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('...');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push('...');

  pages.push(totalPages);
  return pages;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const safeCurrent = clampPage(currentPage, totalPages);
  const pages = getVisiblePages(safeCurrent, totalPages);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange(clampPage(safeCurrent - 1, totalPages))}
        disabled={safeCurrent <= 1}
        className="px-3 py-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>

      <div className="flex items-center space-x-1">
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={[
                'px-3 py-2 border rounded-md text-sm',
                p === safeCurrent
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'hover:bg-gray-50',
              ].join(' ')}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(clampPage(safeCurrent + 1, totalPages))}
        disabled={safeCurrent >= totalPages}
        className="px-3 py-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;

