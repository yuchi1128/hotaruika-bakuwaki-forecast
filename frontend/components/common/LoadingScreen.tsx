import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MapPin, TrendingUp } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen relative z-10">
      <header className="text-center pt-12 pb-8 md:pb-12 px-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            ホタルイカ爆湧き予報
          </h1>
        </div>
        <p className="text-sm md:text-lg text-blue-200 mb-1">ホタルイカの身投げをAIで予測</p>
        <div className="flex items-center justify-center gap-2 text-[11px] md:text-xs text-blue-300">
          <MapPin className="w-3 h-3" />
          <span>富山湾</span>
          <TrendingUp className="w-3 h-3 ml-3" />
          <span>リアルタイム予測</span>
        </div>
      </header>
      <div className="main-container max-w-6xl mx-auto px-3 sm:px-4 pb-12">
        <Card className="mb-8 glow-effect bg-gradient-to-br from-gray-900 via-blue-900/50 to-gray-900 border border-blue-500/30 rounded-3xl shadow-2xl">
          <CardHeader className="text-center pt-8 pb-6">
            <Skeleton className="h-8 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </CardHeader>
          <CardContent className="text-center px-4 pb-8">
            <div className="inline-block px-4 sm:px-8 py-4 rounded-2xl bg-gray-500/20 mb-6">
              <Skeleton className="h-10 w-40 mx-auto mb-4" />
              <Skeleton className="h-24 w-full mb-4" />
              <Skeleton className="h-6 w-64 mx-auto" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto bg-white/5 p-4 rounded-2xl border border-white/10">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Skeleton className="w-5 h-5 mr-1.5 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-32 mx-auto mt-6" />
          </CardContent>
        </Card>

        <Card className="mb-16 bg-transparent border-none shadow-none">
          <CardHeader className="px-0">
            <div className="flex items-center gap-3">
              <Skeleton className="w-7 h-7" />
              <Skeleton className="h-8 w-48" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {[...Array(6)].map((_, index) => (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                    <div className="flex flex-col justify-between p-4 rounded-2xl border h-full border-blue-500/20 bg-white/5">
                      <div>
                        <Skeleton className="h-5 w-24 mx-auto mb-1" />
                        <Skeleton className="h-4 w-20 mx-auto mb-2" />

                        <div className="mb-4 min-h-[5rem] flex flex-col justify-center items-center">
                          <Skeleton className="h-5 w-16 mb-3" />
                          <Skeleton className="h-10 w-full" />
                        </div>

                        <div className="w-full space-y-2 text-xs">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="grid grid-cols-2 items-center bg-white/5 px-2 py-1 rounded">
                              <div className="flex items-center">
                                <Skeleton className="w-4 h-4 mr-1.5 rounded-full" />
                                <Skeleton className="h-3 w-8" />
                              </div>
                              <div className="text-center">
                                <Skeleton className="h-4 w-12 mx-auto" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 w-full flex justify-center">
                        <Skeleton className="h-7 w-full" />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-[-12px] sm:left-[-20px] top-1/2 -translate-y-1/2 flex xl:hidden bg-slate-800/50 hover:bg-slate-700/80 border-slate-600 z-10" />
              <CarouselNext className="absolute right-[-12px] sm:right-[-20px] top-1/2 -translate-y-1/2 flex xl:hidden bg-slate-800/50 hover:bg-slate-700/80 border-slate-600 z-10" />
            </Carousel>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoadingScreen;
