import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, TrendingUp, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AppHeader = () => {
  return (
    <header className="pt-8 pb-8 md:pb-12 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center relative">
        {/* Centered Content */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              ホタルイカ爆湧き予報
            </h1>
          </div>
          <p className="text-sm md:text-lg text-blue-200 mb-1">富山湾の神秘をAIで予測</p>
          <div className="flex items-center justify-center gap-2 text-[11px] md:text-xs text-blue-300">
            <MapPin className="w-3 h-3" />
            <span>富山湾</span>
            <TrendingUp className="w-3 h-3 ml-3" />
            <span>リアルタイム予測</span>
          </div>
        </div>

        {/* Absolutely positioned button within the relative container */}
        <div className="absolute top-0 right-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/about" passHref>
                  <Button variant="ghost" size="icon" className="text-blue-200 hover:bg-blue-500/10 hover:text-blue-100">
                    <Info className="w-5 h-5" />
                    <span className="sr-only">このサイトについて</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>このサイトについて</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
