import Link from 'next/link';
import { BookOpen } from 'lucide-react';

const MannersBanner = () => {
  return (
    <div className="my-8 text-center">
      <Link href="/manners" className="inline-flex items-center gap-2 text-base text-blue-300 hover:text-blue-200 transition-colors">
        <BookOpen className="w-4 h-4" />
        <span className="underline underline-offset-2 decoration-blue-300/30">ホタルイカ掬いでのマナー</span>
        <span>→</span>
      </Link>
    </div>
  );
};

export default MannersBanner;
