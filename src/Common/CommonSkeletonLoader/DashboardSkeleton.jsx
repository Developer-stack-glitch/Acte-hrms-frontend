const SkeletonCard = ({ height = "h-32" }) => (
    <div className={`bg-white rounded-[15px] p-6 border border-gray-100 shadow-sm animate-pulse`}>
        <div className="flex justify-between items-start mb-4">
            <div className="space-y-3 w-full">
                <div className="h-3 bg-slate-200/50 animate-shimmer rounded-lg w-1/3"></div>
                <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-1/2"></div>
            </div>
            <div className="w-12 h-12 bg-slate-100/50 animate-shimmer rounded-xl"></div>
        </div>
        <div className="h-1.5 w-full bg-slate-100/50 animate-shimmer rounded-full mt-4">
            <div className="h-full bg-slate-200/50 animate-shimmer rounded-lg-full w-2/3"></div>
        </div>
    </div>
);

const SkeletonBox = ({ height = "h-[350px]" }) => (
    <div className={`bg-white p-6 rounded-[15px] border border-gray-100 shadow-sm animate-pulse ${height}`}>
        <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-100/50 animate-shimmer rounded-2xl"></div>
            <div className="space-y-2">
                <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-32"></div>
                <div className="h-2 bg-slate-200/50 animate-shimmer rounded-lg w-24"></div>
            </div>
        </div>
        <div className="w-full h-[200px] bg-slate-100/50 animate-shimmer rounded-xl"></div>
    </div>
);

export default function DashboardSkeleton() {
    // We'll mimic the admin dashboard as it's the more complex one
    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:mt-0 mt-3 md:flex-row md:items-center justify-between gap-4 animate-pulse">
                <div className="space-y-2">
                    <div className="h-8 bg-slate-200/50 animate-shimmer rounded-lg w-48"></div>
                    <div className="h-3 bg-slate-200/50 animate-shimmer rounded-lg w-32"></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-10 bg-slate-200/50 animate-shimmer rounded-lg-full w-64"></div>
                    <div className="h-10 w-10 bg-slate-200/50 animate-shimmer rounded-lg-full"></div>
                </div>
            </div>

            {/* Summary Grid Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>

            {/* Secondary Stats Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-[15px] border border-gray-100 shadow-sm animate-pulse flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-2.5 bg-slate-200/50 animate-shimmer rounded-lg w-20"></div>
                            <div className="h-6 bg-slate-200/50 animate-shimmer rounded-lg w-12"></div>
                        </div>
                        <div className="w-12 h-12 bg-slate-100/50 animate-shimmer rounded-xl"></div>
                    </div>
                ))}
            </div>

            {/* Charts Section Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SkeletonBox />
                <SkeletonBox />
            </div>

            {/* Detailed Lists Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-white rounded-[15px] border border-gray-100 shadow-sm animate-pulse h-[400px]">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                        <div className="h-6 bg-slate-200/50 animate-shimmer rounded-lg w-32"></div>
                        <div className="h-8 bg-slate-100/50 animate-shimmer rounded-full w-24"></div>
                    </div>
                    <div className="p-4 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100/50 animate-shimmer rounded-full"></div>
                                    <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-24"></div>
                                </div>
                                <div className="h-4 bg-gray-50 rounded w-16"></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="bg-white rounded-[15px] border border-gray-100 shadow-sm animate-pulse h-[190px]">
                        <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-50 rounded-lg"></div>
                            <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-24"></div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="h-10 bg-slate-100/50 animate-shimmer rounded-xl w-full"></div>
                            <div className="h-10 bg-slate-100/50 animate-shimmer rounded-xl w-full"></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-[15px] border border-gray-100 shadow-sm animate-pulse h-[190px]">
                        <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-50 rounded-lg"></div>
                            <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-24"></div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="h-10 bg-slate-100/50 animate-shimmer rounded-xl w-full"></div>
                            <div className="h-10 bg-slate-100/50 animate-shimmer rounded-xl w-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
