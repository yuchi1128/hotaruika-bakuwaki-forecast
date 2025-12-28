import Link from 'next/link';
import { Button } from '@/components/ui/button';

const AppFooter = () => {
  return (
    <footer className="text-center py-8 text-gray-400 border-t border-blue-500/20">
      <div className="flex flex-col justify-center items-center space-y-2">
        <p className="mb-0">© 2026 ホタルイカ爆湧き予報</p>
        <p className="text-xs">
          AIで身投げを予測。ホタルイカ掬いのタイミングを予報と掲示板で確認。
        </p>
      </div>
    </footer>
  );
};

export default AppFooter;
