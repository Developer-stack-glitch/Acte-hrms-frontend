import React from 'react';

export default function DualPanelSkeleton() {
    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="space-y-2">
                    <div className="h-6 bg-slate-200/50 animate-shimmer rounded-lg w-48"></div>
                    <div className="h-4 bg-slate-50 animate-shimmer rounded w-64"></div>
                </div>
                <div className="w-40 h-10 bg-slate-100/50 animate-shimmer rounded-full"></div>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
                <div className="w-[320px] border-r border-gray-100 p-4 space-y-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-50 animate-shimmer rounded-lg"></div>
                    ))}
                </div>
                
                <div className="flex-1 p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                        <div className="space-y-3 flex-1">
                            <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-1/3"></div>
                            <div className="flex gap-4">
                                <div className="h-4 bg-slate-50 animate-shimmer rounded w-20"></div>
                                <div className="h-4 bg-slate-50 animate-shimmer rounded w-32"></div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-10 h-10 bg-slate-100/50 animate-shimmer rounded-lg"></div>
                            <div className="w-10 h-10 bg-slate-100/50 animate-shimmer rounded-lg"></div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="h-4 bg-slate-50 animate-shimmer rounded w-full"></div>
                        <div className="h-4 bg-slate-50 animate-shimmer rounded w-full"></div>
                        <div className="h-4 bg-slate-50 animate-shimmer rounded w-4/5"></div>
                        <div className="h-4 bg-slate-50 animate-shimmer rounded w-full"></div>
                        <div className="h-4 bg-slate-50 animate-shimmer rounded w-3/4"></div>
                        <div className="h-4 bg-slate-50 animate-shimmer rounded w-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
