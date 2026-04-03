import React from 'react';

export const WebClockWidgetSkeleton = () => (
    <div className="relative bg-[#0F172A] rounded-[15px] border border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] min-h-[350px] flex flex-col overflow-hidden">
        {/* Top Greeting Section */}
        <div className="relative z-10 p-6 pb-4 animate-pulse">
            <div className="space-y-3">
                <div className="h-6 bg-white/10 rounded-lg w-48"></div>
                <div className="h-4 bg-white/5 rounded-lg w-64"></div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 p-4 flex-grow flex flex-col md:flex-row items-center gap-10 bg-white/5 backdrop-blur-xl m-4 rounded-[20px] border border-white/5 animate-pulse">
            {/* Visual Clock Placeholder */}
            <div className="flex-shrink-0 relative">
                <div className="w-40 h-40 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                     <div className="w-20 h-10 bg-white/10 rounded-xl"></div>
                </div>
            </div>

            {/* Right Side: Details and Actions */}
            <div className="flex-grow w-full space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20"></div>
                        <div className="h-6 bg-white/10 rounded-lg w-32"></div>
                    </div>
                    <div className="h-3 bg-white/5 rounded-lg w-40"></div>
                </div>

                {/* Stats Display */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 flex flex-col gap-2">
                        <div className="h-2 bg-white/10 rounded w-16"></div>
                        <div className="h-6 bg-white/10 rounded w-20"></div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 flex flex-col gap-2">
                        <div className="h-2 bg-white/10 rounded w-16"></div>
                        <div className="h-6 bg-white/10 rounded w-20"></div>
                    </div>
                </div>

                {/* Action Hub */}
                <div className="h-11 bg-emerald-500/10 rounded-full w-full border border-emerald-500/5"></div>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-auto bg-black/20 border-t border-white/5 flex items-center justify-between px-8 py-4 animate-pulse">
            <div className="flex items-center gap-8">
                <div className="space-y-1">
                    <div className="h-2 bg-white/5 rounded w-10"></div>
                    <div className="h-3 bg-white/10 rounded w-12"></div>
                </div>
                <div className="h-6 w-[1px] bg-white/10"></div>
                <div className="space-y-1">
                    <div className="h-2 bg-white/5 rounded w-10"></div>
                    <div className="h-3 bg-white/10 rounded w-12"></div>
                </div>
            </div>
            <div className="h-3 bg-white/10 rounded w-16"></div>
        </div>
    </div>
);

export const WebCalendarSkeleton = () => (
    <div className="relative bg-white rounded-[15px] border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] p-4 min-h-[350px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 animate-pulse">
            <div className="h-7 bg-slate-200/60 rounded-lg w-24"></div>
            <div className="w-8 h-8 rounded-full bg-slate-100"></div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center items-center mb-8 animate-pulse">
            <div className="h-10 bg-slate-50 border border-slate-100 rounded-full w-52 flex items-center justify-between px-4">
                 <div className="w-4 h-4 bg-slate-200/50 rounded-full"></div>
                 <div className="h-4 bg-slate-200/50 rounded w-24"></div>
                 <div className="w-4 h-4 bg-slate-200/50 rounded-full"></div>
            </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 mb-6 animate-pulse px-2">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="flex justify-center">
                    <div className="h-2.5 bg-slate-100 rounded w-8"></div>
                </div>
            ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-4 flex-grow animate-pulse px-2">
            {[...Array(35)].map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-50/80 border border-slate-100/50"></div>
                </div>
            ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center gap-6 pt-4 border-t border-gray-50 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    <div className="h-2 bg-slate-100 rounded w-12"></div>
                </div>
            ))}
        </div>
    </div>
);
