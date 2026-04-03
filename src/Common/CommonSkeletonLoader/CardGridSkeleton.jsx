import React from 'react';

export default function CardGridSkeleton({ count = 8 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 h-48 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100/50 animate-shimmer rounded-xl"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-24"></div>
                            <div className="h-3 bg-slate-200/50 animate-shimmer rounded-lg w-16"></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-3 bg-slate-100/50 animate-shimmer rounded-lg w-full"></div>
                        <div className="h-3 bg-slate-100/50 animate-shimmer rounded-lg w-2/3"></div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-20"></div>
                        <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-12"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
