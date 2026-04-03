import React from 'react';

export default function TableSkeleton({ rows = 5, columns = 5 }) {
    return (
        <>
            {[...Array(rows)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/10 transition-colors">
                    {[...Array(columns)].map((_, j) => (
                        <td key={j} className={`px-5 py-4 ${j === columns - 1 ? 'text-right' : ''}`}>
                            <div className={`h-4 bg-gray-100/80 animate-shimmer rounded-md ${
                                j === 0 ? 'w-8' : 
                                j === columns - 1 ? 'w-20 ml-auto' : 
                                j === 1 ? 'w-48' :
                                'w-32'
                            }`}></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
