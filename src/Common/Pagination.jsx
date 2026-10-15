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
const Pagination = ({
    current,
    pageSize,
    total,
    onChange,
    onPageSizeChange,
    showingCount,
    pageSizeOptions = [20, 40, 60, 80, 100],
    entityName = "records"
}) => {
    const totalPages = Math.ceil(total / pageSize) || 1;
    if (total === 0) return null;

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

    const startItem = total === 0 ? 0 : (current - 1) * pageSize + 1;
    const endItem = Math.min(current * pageSize, total);

    return (
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white mt-auto">
            <span className="text-[13px] text-gray-500 font-medium">
                Showing <span className="font-semibold text-gray-800">{startItem}</span> to <span className="font-semibold text-gray-800">{endItem}</span> of <span className="font-semibold text-gray-800">{total}</span> {entityName}
            </span>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {/* Show Rows Dropdown */}
                {onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] text-gray-500 font-medium whitespace-nowrap">Show:</span>
                        <select
                            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-gray-700 outline-none focus:border-primary/50 transition-colors cursor-pointer shadow-xs"
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt} / page
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Page Numbers */}
                <div className="flex items-center gap-1.5">
                    <button
                        disabled={current <= 1}
                        onClick={() => onChange(current - 1)}
                        className="p-1.5 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-primary hover:bg-gray-50 transition-all h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200"
                        title="Previous page"
                    >
                        <span className="text-base font-bold leading-none">‹</span>
                    </button>

                    {pages.map((p, i) => (
                        p === '...' ? (
                            <span key={`sep-${i}`} className="text-gray-400 font-semibold px-1">...</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onChange(p)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-all ${
                                    current === p
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                {p}
                            </button>
                        )
                    ))}

                    <button
                        disabled={current >= totalPages}
                        onClick={() => onChange(current + 1)}
                        className="p-1.5 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-primary hover:bg-gray-50 transition-all h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200"
                        title="Next page"
                    >
                        <span className="text-base font-bold leading-none">›</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
