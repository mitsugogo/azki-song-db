import Link from "next/link"
import { List, ListItem, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";

const Acknowledgment = () => {
  return (
    <>
      <div className="text-sm text-muted">
        <p>本サイトは有志による非公式のファンサイトです。</p>
        <p>AZKiさんの素敵な歌声をもっとみんなに知ってもらうために制作しました。</p>
        <p>気になった歌や動画はどんどんSNSにシェアして盛り上げてください！</p>
      </div>

      <div className="text-sm text-muted mt-3">
        <p>動画はホロライブプロダクション様及びAZKi様が制作したものです。</p>
        <p>動画の権利は制作者に帰属します。</p>
      </div>

      <h3 className="mt-4">Copyright</h3>
      
      <div className="text-sm text-muted">
        <p>© 2025 <Link href="https://x.com/mitsugogo" target="_blank" rel="noopener noreferrer">@mitsugogo</Link></p>
      </div>
    </>
  )
}

export default Acknowledgment