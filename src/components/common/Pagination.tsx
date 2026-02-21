import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const leftSibling = Math.max(1, currentPage - siblingCount);
    const rightSibling = Math.min(totalPages, currentPage + siblingCount);
    
    // Show first page
    if (leftSibling > 1) {
      pages.push(1);
      if (leftSibling > 2) pages.push('...');
    }
    
    // Show middle pages
    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i);
    }
    
    // Show last page
    if (rightSibling < totalPages) {
      if (rightSibling < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <nav className="pagination" aria-label="Pagination">
      <ul className="pagination-list">
        {/* Previous Button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button prev"
            aria-label="Previous page"
          >
            ← Prev
          </button>
        </li>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) => (
          <li key={index}>
            {page === '...' ? (
              <span className="pagination-dots">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        {/* Next Button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button next"
            aria-label="Next page"
          >
            Next →
          </button>
        </li>
      </ul>

      <div className="pagination-info">
        Page {currentPage} of {totalPages}
      </div>
    </nav>
  );
};

export default Pagination;