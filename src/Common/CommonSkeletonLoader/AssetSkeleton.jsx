import React from 'react';

const SkeletonCard = () => (
    <div className="bg-white p-5 rounded-[15px] border border-gray-100 shadow-xl shadow-gray-200/20 relative overflow-hidden animate-pulse">
        <div className="flex items-start justify-between">
            <div className="space-y-3">
                <div className="h-3 bg-slate-200/50 animate-shimmer rounded-lg w-24"></div>
                <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-12"></div>
            </div>
            <div className="w-12 h-12 bg-slate-100/50 animate-shimmer rounded-2xl"></div>
        </div>
    </div>
);

export default function AssetSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between md:gap-4 gap-3">
                <div className="space-y-2">
                    <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-64"></div>
                    <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-80"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 bg-slate-200/50 animate-shimmer rounded-full w-32"></div>
                    <div className="h-10 bg-slate-200/50 animate-shimmer rounded-full w-40"></div>
                </div>
            </div>

            {/* Stats Overview Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="bg-white rounded-[15px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                {/* Toolbar Skeleton */}
                <div className="p-4 md:p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center gap-4 bg-gray-50/30">
                    <div className="flex-1 h-10 bg-white border border-gray-100 rounded-full animate-shimmer"></div>
                    <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0">
                        <div className="h-10 bg-white border border-gray-100 rounded-lg w-44 animate-shimmer"></div>
                        <div className="h-10 bg-white border border-gray-100 rounded-lg w-40 animate-shimmer"></div>
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="p-6 space-y-4">
                    <div className="h-10 bg-slate-50 animate-shimmer rounded-lg w-full"></div>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-16 bg-slate-50/50 animate-shimmer rounded-lg w-full border border-gray-50"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
