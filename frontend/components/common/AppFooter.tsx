import Link from 'next/link';

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
    <footer className="text-center py-6 text-gray-400 border-t border-blue-500/20">
      <div className="flex flex-col justify-center items-center space-y-3">
        <div className="space-y-1">
          <p className="mb-0">© 2026 ホタルイカ爆湧き予報</p>
          <p className="text-xs max-w-[340px] md:max-w-none">
            身投げの予測と掲示板でホタルイカ掬いの参考に。
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <span>各種ご連絡はこちらまで</span>
          <Link
            href="https://x.com/bakuwaki_jp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
          >
            <XIcon className="h-4 w-4" />
            <span className="underline underline-offset-2">@bakuwaki_jp</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;