import { motion } from 'framer-motion';
import TableSkeleton from './CommonSkeletonLoader/TableSkeleton';
import { Edit2, Trash2, Eye } from 'lucide-react'
import Tooltip from './Tooltip';
import NoData from './NoData';
/**
 * A reusable Data Table component with premium styling.
 * 
 * @param {Array} columns - Array of column definitions { header: string, key: string, render: function, align: 'left'|'right'|'center' }
 * @param {Array} data - Array of data objects
 * @param {Function} onView - Callback for view action
 * @param {Function} onEdit - Callback for edit action
 * @param {Function} onDelete - Callback for delete action
 * @param {Boolean} isLoading - Loading state
 * @param {Object} pagination - Pagination info { current, pageSize, total, onChange }
 */
export default function DataTable({
    columns,
    data,
    onView,
    onEdit,
    onDelete,
    extraActions,
    isLoading,
    pagination,
    emptyMessage = "No records found",
    rowClassName
}) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-primary/5">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`px-5 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                                >
                                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                                        {col.header}
                                    </div>
                                </th>
                            ))}
                            {(onView || onEdit || onDelete || extraActions) && (
                                <th className="px-5 py-4 text-[11px] font-bold text-primary uppercase tracking-wider text-right sticky right-0 bg-primary/2 z-9 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                                    <div className="flex items-center justify-end gap-1">
                                        Action
                                    </div>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <TableSkeleton
                                rows={pagination?.pageSize || 5}
                                columns={(columns?.length || 0) + (onView || onEdit || onDelete || extraActions ? 1 : 0)}
                            />
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-6 py-10">
                                    <NoData
                                        title={emptyMessage}
                                        description="Try adjusting your search or filters to find what you're looking for."
                                        icon={<Eye size={40} />}
                                    />
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIdx) => (
                                <motion.tr
                                    key={row.id || rowIdx}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: rowIdx * 0.03 }}
                                    className={`group hover:bg-gray-50/50 transition-colors cursor-default ${rowClassName ? (typeof rowClassName === 'function' ? rowClassName(row, rowIdx) : rowClassName) : ''}`}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className={`px-5 py-4 whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                                            {col.render ? col.render(row[col.key], row, rowIdx) : (
                                                <span className="text-[13px] font-medium text-gray-600">
                                                    {row[col.key]}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                    {(onView || onEdit || onDelete || extraActions) && (
                                        <td className="px-5 py-4 text-right sticky right-0 bg-white group-hover:bg-gray-50/50 transition-colors z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                                            <div className="flex items-center justify-end gap-2 text-gray-400 group-hover:text-gray-600">
                                                {extraActions && extraActions(row)}
                                                {onView && (
                                                    <Tooltip text="View">
                                                        <button
                                                            onClick={() => onView(row)}
                                                            className="h-8 w-8 hover:bg-orange-50 rounded-lg text-orange-500 flex items-center justify-center transition-colors"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </Tooltip>
                                                )}
                                                {onEdit && (
                                                    <Tooltip text="Edit">
                                                        <button
                                                            onClick={() => onEdit(row)}
                                                            className="h-8 w-8 hover:bg-blue-50 rounded-lg text-blue-600 flex items-center justify-center transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </Tooltip>
                                                )}
                                                {onDelete && (
                                                    <Tooltip text="Delete">
                                                        <button
                                                            onClick={() => onDelete(row)}
                                                            className="h-8 w-8 hover:bg-rose-50 rounded-lg text-rose-500 flex items-center justify-center transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white mt-auto">
                    <span className="text-[13px] text-gray-400 font-medium">
                        Showing {data.length} of {pagination.total} records
                    </span>

                    <div className="flex items-center gap-6">
                        {/* Page Numbers */}
                        <div className="flex items-center gap-2">
                            <button
                                disabled={pagination.current === 1}
                                onClick={() => pagination.onChange(pagination.current - 1)}
                                className="p-2 text-gray-400 disabled:opacity-30 hover:text-primary transition-colors"
                            >
                                <span className="text-lg">‹</span>
                            </button>

                            {(() => {
                                const totalPages = Math.ceil(pagination.total / pagination.pageSize);
                                const current = pagination.current;
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

                                return pages.map((p, i) => (
                                    p === '...' ? (
                                        <span key={`sep-${i}`} className="text-gray-400 font-semibold px-1">...</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => pagination.onChange(p)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-medium transition-all ${current === p
                                                ? 'bg-primary text-white shadow-md'
                                                : 'text-gray-500 hover:bg-gray-50 border border-gray-100'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                ));
                            })()}

                            <button
                                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                                onClick={() => pagination.onChange(pagination.current + 1)}
                                className="p-2 text-gray-400 disabled:opacity-30 hover:text-primary transition-colors"
                            >
                                <span className="text-lg">›</span>
                            </button>
                        </div>

                        {/* Show Rows */}
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] text-gray-400 font-medium whitespace-nowrap">Show Rows</span>
                            <select
                                className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[13px] font-medium text-gray-600 outline-none focus:border-primary/30 transition-colors cursor-pointer"
                                value={pagination.pageSize}
                                onChange={(e) => pagination.onPageSizeChange?.(parseInt(e.target.value))}
                            >
                                <option value={10}>10 / page</option>
                                <option value={20}>20 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
