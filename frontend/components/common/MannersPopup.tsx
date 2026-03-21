'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

const MANNERS_POPUP_KEY = 'mannersPopupDismissed';

const MannersPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(MANNERS_POPUP_KEY);
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem(MANNERS_POPUP_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-xs bg-slate-800/95 border-blue-400/30 text-white shadow-xl backdrop-blur-md rounded-lg p-6">
        <DialogTitle className="text-lg font-semibold text-center text-blue-200">
          ホタルイカ掬いを楽しむ皆さまへ
        </DialogTitle>
        <DialogDescription className="text-center text-foreground/80 mt-2 text-sm leading-relaxed">
          一番大切なのは、漁業関係者を含めた近隣住民の迷惑にならないことです。一人ひとりの心がけが、この文化を守ることにつながります。
        </DialogDescription>
        <div className="mt-4">
          <Link href="/manners" onClick={handleClose}>
            <Button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30">
              <BookOpen className="w-4 h-4 mr-2" />
              マナーの詳細を見る
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MannersPopup;
