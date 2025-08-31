'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, HelpCircle, RefreshCw, MapPin, Thermometer, Waves } from 'lucide-react';

interface DetailPageHeaderProps {
  formattedDate: string;
  lastUpdated: Date;
  onBack: () => void;
  date: string;
}

export default function DetailPageHeader({
  formattedDate,
  lastUpdated,
  onBack,
  date,
}: DetailPageHeaderProps) {
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  const helpDateObj = new Date(date);
  const helpNextDateObj = new Date(helpDateObj);
  helpNextDateObj.setDate(helpDateObj.getDate() + 1);

  const formatDateForHelp = (d: Date) =>
    d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });

  const helpDate = formatDateForHelp(helpDateObj);
  const helpNextDate = formatDateForHelp(helpNextDateObj);

  return (
    <header className="mb-4 sm:mb-6">
      <Button onClick={onBack} variant="ghost" className="mb-2 text-white hover:bg-white/10">
        <ArrowLeft className="w-4 h-4 mr-2" />
        戻る
      </Button>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Calendar className="text-blue-300" />
            {formattedDate}
          </h1>
          <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="text-blue-300 hover:text-blue-100 transition-colors"
                aria-label="このページの説明を見る"
              >
                <HelpCircle className="w-6 h-6" />
              </button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md bg-slate-800/80 border-blue-500/50 text-white shadow-lg backdrop-blur-md rounded-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-blue-200">
                  <HelpCircle className="w-5 h-5" />
                  <span>このページの見方</span>
                </DialogTitle>
                <DialogDescription className="sr-only">
                  このダイアログはページの説明です。使い方や更新タイミングなどが書かれています。
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 space-y-5 py-2 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 mt-1 text-green-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">対象エリア</h4>
                    <ul className="text-slate-300 space-y-1">
                      <li>
                        <span className="font-semibold">気象：</span> 富山県 富山市
                      </li>
                      <li>
                        <span className="font-semibold">潮汐：</span> 富山県 岩瀬浜付近
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-6 h-6 mt-1 text-green-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">データの更新</h4>
                    <p className="text-slate-300 leading-relaxed">
                      次の時刻に更新されます：
                      <br />
                      <span className="font-mono text-white">
                        05:00, 08:00, 11:00, 14:00, 17:00, 23:00, 02:00
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Thermometer className="w-6 h-6 mt-1 text-blue-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">気象情報</h4>
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-white">{helpDate} 0時</strong> から{' '}
                      <strong className="text-white">{helpNextDate} 4時</strong>{' '}
                      までの28時間予報です。
                      <br />
                      現在より過去は
                      <strong className="text-amber-300">実績値</strong>、未来は
                      <strong className="text-sky-300">予報値</strong>となります。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Waves className="w-6 h-6 mt-1 text-purple-300 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">潮汐情報</h4>
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-white">{helpDate} 0時</strong> から{' '}
                      <strong className="text-white">{helpNextDate} 4時</strong>{' '}
                      までの28時間予測です。
                      <br />
                      過去・未来にかかわらず、すべて計算に基づいた
                      <strong className="text-purple-300">予測値（推算値）</strong>です。
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex items-center gap-1 text-xs text-blue-200/80 mt-1 pl-1">
          <RefreshCw className="w-3 h-3" />
          <span>
            最終更新 {lastUpdated.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </header>
  );
}
