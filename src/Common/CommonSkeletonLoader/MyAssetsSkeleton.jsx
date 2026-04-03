import React from 'react';

const CardSkeleton = () => (
    <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden animate-pulse p-6">
        <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-[10px] bg-slate-200/50 animate-shimmer"></div>
            <div className="h-6 w-24 bg-slate-200/50 animate-shimmer rounded-full"></div>
        </div>
        <div className="space-y-3 mb-6">
            <div className="h-6 bg-slate-200/50 animate-shimmer rounded-lg w-1/2"></div>
            <div className="h-3 bg-slate-200/50 animate-shimmer rounded-lg w-1/3"></div>
        </div>
        <div className="space-y-4 pt-6 border-t border-gray-50">
            <div className="flex justify-between">
                <div className="h-3 bg-slate-200/50 animate-shimmer rounded w-20"></div>
                <div className="h-3 bg-slate-200/50 animate-shimmer rounded w-24"></div>
            </div>
            <div className="flex justify-between">
                <div className="h-3 bg-slate-200/50 animate-shimmer rounded w-20"></div>
                <div className="h-3 bg-slate-200/50 animate-shimmer rounded w-24"></div>
            </div>
            <div className="flex justify-between">
                <div className="h-3 bg-slate-200/50 animate-shimmer rounded w-16"></div>
                <div className="h-3 bg-slate-200/50 animate-shimmer rounded w-20"></div>
            </div>
        </div>
    </div>
);

export default function MyAssetsSkeleton() {
    return (
        <div className="p-4 md:p-0 max-w-7xl mx-auto space-y-10 animate-pulse">
            <div>
                <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-64 mb-2"></div>
                <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-80"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
