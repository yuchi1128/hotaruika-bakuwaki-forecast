import Link from 'next/link';
import { Button } from '@/components/ui/button';

const XIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    className={className}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const AppFooter = () => {
  return (
    <footer className="text-center py-4 text-gray-400 border-t border-blue-500/20">
      <div className="flex flex-col justify-center items-center space-y-1">
        <div className="space-y-2">
          <p className="mb-0">© 2026 ホタルイカ爆湧き予報</p>
          <p className="text-xs">
            AIで身投げを予測。ホタルイカ掬いの好機を、予報と掲示板でチェック。
          </p>
        </div>

        <div className="flex gap-4">
          <Button variant="ghost" size="icon" className="hover:text-white" asChild>
            <Link
              href="https://x.com/bakuwaki_jp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter) アカウントへ"
            >
              <XIcon className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;