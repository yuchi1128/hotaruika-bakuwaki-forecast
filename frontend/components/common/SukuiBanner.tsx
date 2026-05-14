import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const SukuiBanner = () => {
  return (
    <div className="mt-4 mb-3 text-center">
      <Link href="/hotaruika-sukui-guide" className="inline-flex items-center gap-2 text-base text-blue-300 hover:text-blue-200 transition-colors">
        <Sparkles className="w-4 h-4" />
        <span className="underline underline-offset-2 decoration-blue-300/30">ホタルイカ掬い完全ガイド</span>
        <span>→</span>
      </Link>
    </div>
  );
};

export default SukuiBanner;
