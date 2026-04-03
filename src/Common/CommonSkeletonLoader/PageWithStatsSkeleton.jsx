import React from 'react';

export default function PageWithStatsSkeleton() {
    return (
        <div className="flex flex-col gap-8 p-3 animate-pulse">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-64"></div>
                    <div className="h-4 bg-slate-100/50 animate-shimmer rounded w-48"></div>
                </div>
                <div className="h-10 bg-slate-100/50 animate-shimmer rounded-full w-40"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-5 rounded-[10px] border border-gray-100 h-24 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="h-3 bg-slate-100/50 animate-shimmer rounded w-20"></div>
                            <div className="w-10 h-10 bg-slate-100/50 animate-shimmer rounded-xl"></div>
                        </div>
                        <div className="h-6 bg-slate-200/50 animate-shimmer rounded-lg w-16"></div>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[15px] border border-gray-100 h-[500px] flex flex-col">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/10">
                    <div className="h-10 bg-slate-100/50 animate-shimmer rounded-full w-64"></div>
                    <div className="h-10 bg-slate-100/50 animate-shimmer rounded-full w-32"></div>
                </div>
                <div className="flex-1 p-6 space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-12 bg-slate-50 animate-shimmer rounded-xl w-full"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
