import Link from "next/link"
import { List, ListItem, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";

const Acknowledgment = () => {
  return (
    <>
      <div className="text-sm text-muted">
        <p>本サイトは有志による非公式のファンサイトです。</p>
        <p>ホロライブ所属のAZKiさんの素敵な歌声を、もっと多くの方々に知ってもらうために制作しました。</p>
        <p>気になった歌や動画はどんどんSNSにシェアして、AZKiさんのYouTubeチャンネルを盛り上げてください！</p>
      </div>

      <h3 className="mt-4 font-semibold">動画について</h3>

      <div className="text-sm text-muted mt-1">
        <p>動画やアーカイブはホロライブプロダクション様及びAZKi様が制作・配信したものです。</p>
        <p>動画の権利は所有者に帰属します。</p>
      </div>

      <h3 className="mt-4 font-semibold">集計について</h3>

      <div className="text-sm text-muted mt-1">
        <p>集計対象は、AZKiさんのYouTubeチャンネルや他のホロメンや他事務所等にゲスト参加されたあずきんち歌枠・記念ライブ・AZKi生放送・Music Video・カバーMVなどの御本人の歌唱動画を対象にしています。</p>
        <p>集計は手作業で行っているため、更新の遅延や誤り、表記揺れなどがあるかもしれません。</p>
        <p>情報の不足や誤りに気づいた場合は、<Link href="https://x.com/mitsugogo" className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500" target="_blank" rel="noopener noreferrer">@mitsugogo</Link>までご連絡ください。</p>
      </div>

      <h3 className="mt-4 font-semibold">アイコン</h3>
      <div className="text-sm text-muted mt-1">
        <p>アイコンは、<Link href="https://x.com/YsWeissYs" className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500" target="_blank" rel="noopener noreferrer">わいす / Y's (@YsWeissYs)</Link> さんにご提供いただいたアイコンを使用しています。</p>
      </div>

      <h3 className="mt-4 font-semibold">Copyright</h3>

      <div className="text-sm text-muted">
        <p>© 2025 <Link href="https://x.com/mitsugogo" className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500" target="_blank" rel="noopener noreferrer">mitsugogo</Link></p>
      </div>
    </>
  )
}

export default Acknowledgment