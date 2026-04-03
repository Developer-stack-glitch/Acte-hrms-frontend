import React from 'react';

const CardSkeleton = () => (
    <div className="bg-white p-6 rounded-[15px] border border-gray-100 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-slate-100 animate-shimmer rounded-xl"></div>
            <div className="w-12 h-6 bg-slate-50 animate-shimmer rounded-lg"></div>
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-slate-100 animate-shimmer rounded-lg w-1/2"></div>
            <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-2/3"></div>
        </div>
    </div>
);

export const ManageLeavesSkeleton = () => (
    <div className="flex flex-col gap-6 p-4 bg-gray-50/50 min-h-full animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div className="space-y-2">
                <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-64"></div>
                <div className="h-4 bg-slate-100 animate-shimmer rounded-lg w-80"></div>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-10 bg-white border border-gray-100 animate-shimmer rounded-full w-48"></div>
                <div className="h-10 bg-white border border-gray-100 animate-shimmer rounded-full w-40"></div>
            </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List Skeleton */}
            <div className="lg:col-span-2 bg-white rounded-[15px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 animate-shimmer rounded-xl"></div>
                        <div className="h-6 bg-slate-200/50 animate-shimmer rounded-lg w-32"></div>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 animate-shimmer"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-32"></div>
                                    <div className="h-3 bg-slate-100 animate-shimmer rounded-lg w-24"></div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 w-20 bg-slate-50 animate-shimmer rounded-xl"></div>
                                <div className="h-8 w-20 bg-slate-50 animate-shimmer rounded-xl"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chart Skeleton */}
            <div className="bg-white p-6 rounded-[15px] border border-gray-100 shadow-sm flex flex-col h-[500px]">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-slate-100 animate-shimmer rounded-xl"></div>
                    <div className="h-6 bg-slate-200/50 animate-shimmer rounded-lg w-40"></div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                    <div className="w-48 h-48 rounded-full border-[15px] border-slate-50 animate-shimmer"></div>
                    <div className="w-full space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-[10px]">
                                <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-24"></div>
                                <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-8"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const LeaveListSkeleton = () => (
    <div className="flex flex-col h-full bg-white animate-pulse">
        <div className="p-6 border-b border-gray-100 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-56"></div>
                    <div className="h-4 bg-slate-100 animate-shimmer rounded-lg w-72"></div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="h-10 bg-slate-50 animate-shimmer rounded-full w-48"></div>
                    <div className="h-10 bg-slate-50 animate-shimmer rounded-full w-40"></div>
                </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 bg-slate-50 animate-shimmer border border-gray-100 rounded-xl min-w-[140px]"></div>
                ))}
            </div>
        </div>
        <div className="flex-1 p-6">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 h-12 border-b border-gray-100"></div>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-16 border-b border-gray-50 flex items-center px-4 gap-4">
                        <div className="h-4 bg-slate-50 animate-shimmer rounded w-full"></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const HolidaySkeleton = () => (
    <div className="p-8 animate-pulse bg-gray-50/50 min-h-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="space-y-2">
                <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-48"></div>
                <div className="h-4 bg-slate-100 animate-shimmer rounded-lg w-64"></div>
            </div>
            <div className="h-10 bg-slate-200/50 animate-shimmer rounded-full w-36"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-shimmer"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-100 animate-shimmer rounded-lg w-24"></div>
                        <div className="h-6 bg-slate-200/50 animate-shimmer rounded-lg w-12"></div>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-10">
            <div className="flex-1 h-12 bg-white border border-gray-200 animate-shimmer rounded-xl"></div>
            <div className="w-48 h-12 bg-white border border-gray-100 animate-shimmer rounded-xl"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 animate-shimmer shrink-0"></div>
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="h-5 bg-slate-200/50 animate-shimmer rounded-lg w-32"></div>
                            <div className="h-4 bg-slate-100 animate-shimmer rounded-full w-16"></div>
                        </div>
                        <div className="h-3 bg-slate-50 animate-shimmer rounded w-full"></div>
                        <div className="h-3 bg-slate-50 animate-shimmer rounded w-2/3"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const AddLeaveSkeleton = () => (
    <div className="flex flex-col h-full bg-white animate-pulse">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="space-y-2">
                <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-56"></div>
                <div className="h-4 bg-slate-100 animate-shimmer rounded-lg w-80"></div>
            </div>
            <div className="flex gap-3">
                <div className="h-10 bg-slate-200/50 animate-shimmer rounded-full w-40"></div>
                <div className="h-10 w-10 bg-slate-100 animate-shimmer rounded-full"></div>
            </div>
        </div>
        
        <div className="flex-1 p-8 bg-gray-50/50 space-y-8 overflow-y-auto">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
                    <div className="h-6 bg-slate-100 animate-shimmer rounded-lg w-48 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2].map(j => (
                            <div key={j} className="space-y-3">
                                <div className="h-3 bg-slate-50 animate-shimmer rounded w-24"></div>
                                <div className="h-12 bg-slate-50 animate-shimmer rounded-xl w-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);
