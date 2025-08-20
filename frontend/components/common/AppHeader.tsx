import { MapPin, TrendingUp } from 'lucide-react';

const AppHeader = () => {
  return (
    <header className="text-center pt-12 pb-8 md:pb-12 px-4">
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
    </header>
  );
};

export default AppHeader;
