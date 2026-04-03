import React from 'react';

export default function AttendanceSkeleton() {
    return (
        <div className="flex flex-col md:gap-8 gap-4 p-3 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="w-full lg:flex-1 h-10 bg-white rounded-2xl border border-gray-100 animate-shimmer"></div>
                <div className="w-full lg:w-auto h-10 bg-white rounded-2xl border border-gray-100 animate-shimmer"></div>
            </div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 h-32 flex flex-col p-4 space-y-3">
                        <div className="flex justify-between">
                            <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-20"></div>
                            <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-10"></div>
                        </div>
                        <div className="h-8 bg-slate-50 animate-shimmer rounded w-16"></div>
                        <div className="h-3 bg-slate-50 animate-shimmer rounded w-full mt-auto"></div>
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-[15px] border border-gray-100 h-96 p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-48"></div>
                    <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-64"></div>
                </div>
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-50 animate-shimmer rounded-lg w-full"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
