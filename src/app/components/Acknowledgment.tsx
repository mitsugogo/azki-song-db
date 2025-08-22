import Link from "next/link";
import {
  List,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { FaGithub } from "react-icons/fa6";

const Acknowledgment = () => {
  return (
    <>
      <div className="text-sm text-muted">
        <p>本サイトは有志による非公式のファンサイトです。</p>
        <p>
          ホロライブ所属のAZKiさんの素敵な歌声を、もっと多くの方々に知ってもらうために制作しました。
        </p>
        <p>
          気になった歌や動画はどんどんSNSにシェアして、AZKiさんの活動を応援しましょう！
        </p>
      </div>

      <h3 className="mt-4 font-semibold">動画について</h3>

      <div className="text-sm text-muted mt-1">
        <p>
          動画やアーカイブはホロライブプロダクション様及び、AZKi様、各チャンネルの管理者が制作・配信したものです。
        </p>
        <p>動画の権利は所有者に帰属します。</p>
      </div>

      <h3 className="mt-4 font-semibold">集計について</h3>

      <div className="text-sm text-muted mt-1">
        <p>
          集計対象は、AZKiさんのYouTubeチャンネルや他のホロメン・ゲスト参加されたあずきんち歌枠・記念ライブ・AZKi生放送・Music
          Video・カバーMV・御本人以外のチャンネルのゲスト出演など、AZKiさん御本人の歌唱動画を対象にしています。
        </p>
        <p>
          集計は手作業で行っているため、更新の遅延や誤り、表記揺れなどがあるかもしれません。
        </p>
        <p>
          情報の不足や誤りに気づいた場合は、
          <Link
            href="https://x.com/mitsugogo"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            @mitsugogo
          </Link>
          までご連絡ください。
        </p>
      </div>

      <h3 className="mt-4 font-semibold">アイコンについて</h3>
      <div className="text-sm text-muted mt-1">
        <p>
          アイコンは、
          <Link
            href="https://x.com/YsWeissYs"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            わいす / Ys (@YsWeissYs)
          </Link>{" "}
          さんにご提供いただいたアイコンを使用しています。
        </p>
      </div>

      <h3 className="mt-4 font-semibold">使用ライブラリ</h3>
      <div className="text-sm text-muted mt-1">
        <p>以下のライブラリを使用しています。</p>
        <Table className="mt-2">
          <TableHead>
            <TableHeadCell>ライブラリ名</TableHeadCell>
            <TableHeadCell>バージョン</TableHeadCell>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>@emotion/react</TableCell>
              <TableCell>^11.14.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@emotion/styled</TableCell>
              <TableCell>^11.14.1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@fortawesome/free-brands-svg-icons</TableCell>
              <TableCell>^7.0.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@fortawesome/free-solid-svg-icons</TableCell>
              <TableCell>^7.0.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@fortawesome/react-fontawesome</TableCell>
              <TableCell>^0.2.3</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@headlessui/react</TableCell>
              <TableCell>^2.2.7</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@heroicons/react</TableCell>
              <TableCell>^2.2.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@mui/icons-material</TableCell>
              <TableCell>^7.3.1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@mui/material</TableCell>
              <TableCell>^7.3.1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@mui/styled-engine-sc</TableCell>
              <TableCell>^7.3.1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@vercel/analytics</TableCell>
              <TableCell>^1.5.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@vercel/og</TableCell>
              <TableCell>^0.8.5</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@vercel/speed-insights</TableCell>
              <TableCell>^1.2.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>autoprefixer</TableCell>
              <TableCell>^10.4.21</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>flowbite-react</TableCell>
              <TableCell>^0.12.6</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>googleapis</TableCell>
              <TableCell>^156.0.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>next</TableCell>
              <TableCell>15.5.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>overlayscrollbars-react</TableCell>
              <TableCell>^0.5.6</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>postcss</TableCell>
              <TableCell>^8.5.6</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react</TableCell>
              <TableCell>19.1.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react-dom</TableCell>
              <TableCell>19.1.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react-fast-marquee</TableCell>
              <TableCell>^1.6.5</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react-icons</TableCell>
              <TableCell>^5.5.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react-youtube</TableCell>
              <TableCell>^10.1.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>styled-components</TableCell>
              <TableCell>^6.1.19</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <h3 className="mt-4 font-semibold">管理</h3>

      <div className="text-sm text-muted">
        <p>
          <Link
            href="https://github.com/mitsugogo/azki-song-db"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub className="inline-block mr-1" />
            GitHub
          </Link>
          &nbsp;
          <Link
            href="https://x.com/mitsugogo"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            (@mitsugogo)
          </Link>
        </p>
      </div>
    </>
  );
};

export default Acknowledgment;
