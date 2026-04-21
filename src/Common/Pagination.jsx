import React from 'react';

/**
 * A reusable Pagination component with premium styling.
 * 
 * @param {Number} current - Current page number
 * @param {Number} pageSize - Number of items per page
 * @param {Number} total - Total number of items
 * @param {Function} onChange - Callback for page change
 * @param {Function} onPageSizeChange - Callback for page size change
 */
const Pagination = ({ current, pageSize, total, onChange, onPageSizeChange, showingCount }) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1 && !onPageSizeChange) return null;

    let pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (current <= 4) {
            pages = [1, 2, 3, 4, 5, '...', totalPages];
        } else if (current >= totalPages - 3) {
            pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = [1, '...', current - 1, current, current + 1, '...', totalPages];
        }
    }

    return (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white mt-auto rounded-b-[20px]">
            <span className="text-[13px] text-gray-400 font-medium">
                Showing {showingCount || 0} of {total} staff
            </span>

            <div className="flex items-center gap-6">
                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                    <button
                        disabled={current === 1}
                        onClick={() => onChange(current - 1)}
                        className="p-2 text-gray-400 disabled:opacity-30 hover:text-primary transition-colors h-8 w-8 flex items-center justify-center rounded-lg border border-gray-100"
                    >
                        <span className="text-lg leading-none">‹</span>
                    </button>

                    {pages.map((p, i) => (
                        p === '...' ? (
                            <span key={`sep-${i}`} className="text-gray-400 font-semibold px-1">...</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onChange(p)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-medium transition-all ${current === p
                                    ? 'bg-primary text-white'
                                    : 'text-gray-500 hover:bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                {p}
                            </button>
                        )
                    ))}

                    <button
                        disabled={current >= totalPages}
                        onClick={() => onChange(current + 1)}
                        className="p-2 text-gray-400 disabled:opacity-30 hover:text-primary transition-colors h-8 w-8 flex items-center justify-center rounded-lg border border-gray-100"
                    >
                        <span className="text-lg leading-none">›</span>
                    </button>
                </div>

                {/* Show Rows */}
                {onPageSizeChange && (
                    <div className="flex items-center gap-3">
                        <span className="text-[13px] text-gray-400 font-medium whitespace-nowrap">Show Rows</span>
                        <select
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-gray-600 outline-none focus:border-primary/30 transition-colors cursor-pointer"
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                        >
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                            <option value={100}>100 / page</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Pagination;
