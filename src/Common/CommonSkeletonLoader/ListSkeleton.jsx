export default function ListSkeleton({ count = 6 }) {
    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-2 bg-white rounded-2xl border border-gray-50 h-16">
                    <div className="w-10 h-10 bg-slate-100/50 animate-shimmer rounded-2xl"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200/50 animate-shimmer rounded-lg w-1/2"></div>
                        <div className="h-2 bg-slate-200/50 animate-shimmer rounded-lg w-1/3"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
