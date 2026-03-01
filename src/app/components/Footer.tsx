export default function Footer() {
  return (
    <>
      <div className="hidden lg:block h-8" aria-hidden="true" />
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-gray-800 text-white py-2 px-4 text-center hidden lg:block">
        <p className="text-xs">
          本サイトは有志による非公式のファンサイトです。
          <span className="hidden lg:inline">
            動画はホロライブプロダクション様及びAZKi様が制作したものです。
          </span>
          動画の権利は制作者に帰属します。
        </p>
      </footer>
    </>
  );
}
