import React from 'react';

export default function FormSkeleton() {
    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100/50 animate-shimmer rounded-full"></div>
                    <div className="space-y-2">
                        <div className="h-5 bg-slate-200/50 animate-shimmer rounded-lg w-48"></div>
                        <div className="h-3 bg-slate-200/50 animate-shimmer rounded-lg w-64"></div>
                    </div>
                </div>
                <div className="w-32 h-10 bg-slate-100/50 animate-shimmer rounded-full"></div>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
                <div className="w-64 bg-white border-r border-gray-100 p-4 space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-50 animate-shimmer rounded-xl"></div>
                    ))}
                </div>
                
                <div className="flex-1 p-8">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-1/3"></div>
                                <div className="h-12 bg-slate-50 animate-shimmer rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
