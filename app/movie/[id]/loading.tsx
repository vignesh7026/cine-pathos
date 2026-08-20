import BackToResultsButton from "@/components/BackToResultsButton";

export default function MovieLoading() {
  return (
    <main className="min-h-screen bg-[#050510] p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <BackToResultsButton />

        <div className="bg-[#1a1a2e] rounded-2xl overflow-hidden shadow-2xl border border-white/5 animate-pulse">
          <div className="flex flex-col md:flex-row">
            {/* Poster Skeleton */}
            <div className="relative md:w-2/5 aspect-[2/3] bg-[#0d0d1a] flex-shrink-0 overflow-hidden flex items-center justify-center">
              <div className="w-full h-full bg-white/5 animate-pulse" />
            </div>

            {/* Info Skeleton */}
            <div className="flex-1 p-6 space-y-4">
              <div className="h-8 w-3/4 bg-white/10 rounded-md animate-pulse" />

              <div className="flex items-center gap-3">
                <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
                <span className="text-white/20">•</span>
                <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                <span className="text-white/20">•</span>
                <div className="h-4 w-20 bg-emerald-500/20 rounded animate-pulse" />
              </div>

              <div className="flex gap-2 pt-1">
                <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
                <div className="h-6 w-14 bg-white/10 rounded-full animate-pulse" />
              </div>

              <div className="space-y-2 pt-2">
                <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-white/10 rounded animate-pulse" />
              </div>

              <div className="pt-4">
                <div className="h-4 w-28 bg-white/10 rounded mb-3 animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-10 w-24 bg-white/10 rounded-lg animate-pulse" />
                  <div className="h-10 w-24 bg-white/10 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Trailer Skeleton */}
          <div className="p-6 border-t border-white/5">
            <div className="h-6 w-24 bg-white/10 rounded mb-3 animate-pulse" />
            <div className="aspect-video w-full rounded-lg bg-black/40 animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
