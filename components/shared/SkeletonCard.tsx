export function SkeletonCard() {
  return (
    <div className="glass-card rounded-xl p-4 md:p-5 w-full flex flex-col gap-4 animate-pulse">
      <div className="flex gap-4">
        {/* Optional Image/Avatar Skeleton */}
        <div className="w-16 h-16 md:w-24 md:h-24 bg-muted rounded-lg shrink-0" />
        
        <div className="flex-1 flex flex-col gap-2 justify-center">
          <div className="h-4 bg-muted rounded-md w-3/4" />
          <div className="h-3 bg-muted rounded-md w-1/2" />
          <div className="h-3 bg-muted rounded-md w-2/3" />
        </div>
      </div>
    </div>
  )
}
