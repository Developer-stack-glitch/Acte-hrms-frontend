import React from 'react';

export const JobBoardSkeleton = () => (
    <div className="p-8 animate-pulse bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div className="space-y-2">
                <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-48"></div>
                <div className="h-4 bg-slate-100/50 animate-shimmer rounded-lg w-64"></div>
            </div>
            <div className="h-10 bg-slate-200/50 animate-shimmer rounded-full w-40"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-[15px] border border-gray-100 p-6 space-y-6">
                    <div className="flex justify-between">
                        <div className="h-6 bg-slate-100/50 animate-shimmer rounded-full w-20"></div>
                        <div className="flex gap-1">
                            <div className="h-8 w-8 bg-slate-50 animate-shimmer rounded-xl"></div>
                            <div className="h-8 w-8 bg-slate-50 animate-shimmer rounded-xl"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-7 bg-slate-200/50 animate-shimmer rounded-lg w-3/4"></div>
                        <div className="h-4 bg-slate-100/50 animate-shimmer rounded-lg w-1/2"></div>
                    </div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, j) => (
                            <div key={j} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-50 animate-shimmer"></div>
                                <div className="h-4 bg-slate-50 animate-shimmer rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                        <div className="h-6 bg-slate-50 animate-shimmer rounded-full w-32"></div>
                        <div className="h-8 bg-slate-100/50 animate-shimmer rounded-full w-24"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const ApplicantsSkeleton = () => (
    <div className="flex flex-col h-full bg-white animate-pulse">
        {/* Header Skeleton */}
        <div className="p-6 border-b border-gray-100 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 animate-shimmer rounded-xl"></div>
                    <div className="space-y-2">
                        <div className="h-6 bg-slate-200/50 animate-shimmer rounded-lg w-48"></div>
                        <div className="h-3 bg-slate-100 animate-shimmer rounded-lg w-40"></div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 bg-slate-200/50 animate-shimmer rounded-full w-32"></div>
                    <div className="w-10 h-10 bg-slate-100 animate-shimmer rounded-xl"></div>
                </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-50 animate-shimmer border border-gray-100 rounded-xl min-w-[140px]"></div>
                ))}
            </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="w-[380px] border-r border-gray-100 bg-white p-5 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-100 animate-shimmer rounded w-24"></div>
                    <div className="w-8 h-8 bg-slate-50 animate-shimmer rounded-lg"></div>
                </div>
                <div className="h-10 bg-slate-50 animate-shimmer rounded-xl w-full"></div>
                <div className="space-y-1">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex gap-4 p-4 border-b border-gray-50">
                            <div className="w-10 h-10 rounded-full bg-slate-100 animate-shimmer shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-100 animate-shimmer rounded w-3/4"></div>
                                <div className="h-3 bg-slate-50 animate-shimmer rounded w-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 p-8 space-y-8 bg-gray-50/20">
                <div className="h-20 bg-white border border-gray-100 animate-shimmer rounded-2xl w-full"></div>
                <div className="grid grid-cols-2 gap-8">
                    <div className="h-48 bg-white border border-gray-100 animate-shimmer rounded-2xl"></div>
                    <div className="h-48 bg-white border border-gray-100 animate-shimmer rounded-2xl"></div>
                </div>
                <div className="h-64 bg-white border border-gray-100 animate-shimmer rounded-2xl w-full"></div>
            </div>
        </div>
    </div>
);

export const FormSkeleton = () => (
    <div className="p-8 animate-pulse bg-white min-h-full">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-slate-100 animate-shimmer rounded-xl"></div>
            <div className="space-y-2">
                <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-64"></div>
                <div className="h-4 bg-slate-100 animate-shimmer rounded-lg w-80"></div>
            </div>
        </div>
        
        <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
                <section key={i} className="space-y-6">
                    <div className="h-6 bg-slate-100 animate-shimmer rounded-lg w-48 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, j) => (
                            <div key={j} className="space-y-2">
                                <div className="h-3 bg-slate-50 animate-shimmer rounded w-20"></div>
                                <div className="h-10 bg-slate-50 animate-shimmer rounded-xl w-full"></div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    </div>
);
