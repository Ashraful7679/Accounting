'use client';

export function Skeleton({ className = '', width, height }: { className?: string; width?: string; height?: string }) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height }}
        />
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <Skeleton width="100%" height="48px" />
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="glass rounded-xl p-6 space-y-4">
            <Skeleton width="60%" height="24px" />
            <Skeleton width="100%" height="80px" />
            <div className="flex gap-2">
                <Skeleton width="80px" height="32px" />
                <Skeleton width="80px" height="32px" />
            </div>
        </div>
    );
}
