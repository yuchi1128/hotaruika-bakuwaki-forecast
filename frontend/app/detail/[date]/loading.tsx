// app/detail/[date]/loading.tsx

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Thermometer, Waves } from 'lucide-react';

export default function DetailLoading() {
  return (
    <div className="min-h-screen relative z-10 p-4 sm:p-4 md:p-6 max-w-7xl mx-auto text-white safe-area">
      {/* Header Skeleton */}
      <header className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 sm:h-9 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 sm:h-9 w-20" />
            <Skeleton className="h-8 sm:h-9 w-20" />
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-3">
                <Calendar className="text-blue-300" />
                <Skeleton className="h-8 sm:h-10 w-64" />
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-200/80 mt-1 pl-1">
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </header>

      <main className="space-y-6 sm:space-y-8 pb-4 sm:pb-8">
        {/* BakuwakiIndexDisplay Skeleton */}
        <div className="relative w-full overflow-hidden glow-effect bg-gradient-to-br from-gray-900 via-blue-900/40 to-gray-900 border border-blue-500/30 rounded-3xl shadow-2xl p-6">
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <Skeleton className="w-48 h-48 md:w-52 md:h-52 rounded-full" />
            <div className="mt-4 text-center">
              <Skeleton className="h-12 w-48 mt-2" />
              <Skeleton className="h-6 w-64 mt-2" />
            </div>
          </div>
        </div>

        {/* Hourly Forecast Skeleton */}
        <div className="relative">
          <div className="mt-6 mb-3 ml-1">
            <Skeleton className="h-7 w-48" />
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="flex">
              {[...Array(28)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-16 sm:w-24 flex flex-col items-center justify-around p-1.5 sm:p-3 text-center h-40 sm:h-52 border-r border-white/10 last:border-r-0 bg-slate-950/40"
                >
                  <Skeleton className="h-5 sm:h-6 w-10 sm:w-12" />
                  <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                  <Skeleton className="h-6 sm:h-7 w-12 sm:w-16" />
                  <Skeleton className="h-3 sm:h-4 w-10 sm:w-14" />
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Weather Chart Skeleton */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-900/40 border-blue-500/20 h-full">
              <CardHeader className="pb-2 sm:pb-6">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-6 h-6 text-blue-200" />
                  <Skeleton className="h-7 w-48" />
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 h-[280px] md:h-[400px]">
                <Skeleton className="w-full h-full" />
              </CardContent>
            </Card>
          </div>

          {/* Tide Chart Skeleton */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/40 border-purple-500/20 h-full">
              <CardHeader className="pb-2 sm:pb-3 lg:pb-2">
                <div className="flex items-center gap-2">
                  <Waves className="w-6 h-6 text-purple-200" />
                  <Skeleton className="h-7 w-40" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col p-4 h-[380px] md:h-[400px] gap-4">
                <div className="flex items-center justify-center gap-6 sm:gap-9 bg-white/5 p-2 sm:p-3 rounded-lg">
                  <Skeleton className="w-24 h-12" />
                  <Skeleton className="w-16 h-12" />
                </div>
                <div className="flex flex-row gap-2 justify-center mt-2 flex-wrap">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="w-20 h-10" />
                  ))}
                </div>
                <div className="flex-grow">
                  <Skeleton className="w-full h-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}