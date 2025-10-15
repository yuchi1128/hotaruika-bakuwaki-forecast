import Link from 'next/link';
import { Button } from '@/components/ui/button';

const AppFooter = () => {
  return (
    <footer className="text-center py-8 text-gray-400 border-t border-blue-500/20">
      <div className="flex justify-center items-center space-x-4">
        <p className="mb-0">© 2026 ホタルイカ爆湧き予報</p>
      </div>
    </footer>
  );
};

export default AppFooter;
