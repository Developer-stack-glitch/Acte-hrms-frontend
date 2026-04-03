import React from 'react';

export default function SalaryStructureSkeleton({ count = 3 }) {
    return (
        <div className="space-y-6">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-white rounded-[15px] p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div className="space-y-6 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-48 bg-gray-100/80 animate-shimmer rounded-lg"></div>
                                <div className="w-3 h-3 rounded-full bg-gray-100/80"></div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-gray-50/80 animate-shimmer rounded"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-24 bg-gray-100/50 animate-shimmer rounded-full"></div>
                                        <div className="h-6 w-24 bg-gray-100/50 animate-shimmer rounded-full"></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-gray-50/80 animate-shimmer rounded"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-32 bg-gray-100/50 animate-shimmer rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-6 shrink-0">
                            <div className="h-10 w-40 bg-gray-50/80 animate-shimmer rounded-xl"></div>
                            <div className="h-10 w-40 bg-gray-50/80 animate-shimmer rounded-xl"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
