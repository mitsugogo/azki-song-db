import { List } from "@mantine/core";
import Link from "next/link";
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

      <h3 className="mt-5 font-semibold">動画について</h3>

      <div className="text-sm text-muted mt-1">
        <p>
          動画やアーカイブはホロライブプロダクション様及び、AZKi様、各チャンネルの管理者が制作・配信したものです。
        </p>
        <p className="mt-2">
          動画の権利は所有者に帰属します。また、制作者が動画を非公開にした場合は閲覧できなくなります。
        </p>
        <p className="mt-2">
          本サイトでは、第三者による動画（いわゆる切り抜き動画）ではなく、公式で公開されている動画を掲載しています。
        </p>
      </div>

      <h3 className="mt-5 font-semibold">集計について</h3>

      <div className="text-sm text-muted mt-1">
        <p>
          集計対象は、YouTube上で一般公開されている歌枠・記念ライブ・生放送・Music
          Video・カバー楽曲・MV・ゲスト出演など、AZKiさん御本人の歌唱動画を対象にしています。
        </p>
        <p className="mt-2">
          「0期生の記念ライブ」などの配信については、AZKiさんが歌唱していない部分も収録している場合があります。
        </p>
        <p className="mt-2">
          メンバーシップ限定動画や非公開動画、有料配信など広く閲覧できない動画は対象外としています。
        </p>
        <p className="mt-2">
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

      <h3 className="mt-5 font-semibold">アイコンについて</h3>
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
        <p className="mt-2">
          ソースコードはMIT
          LICENSEですが、アイコンについては適用されませんのでご注意ください。
        </p>
      </div>

      <h3 className="mt-5 font-semibold">使用ライブラリ</h3>
      <div className="text-sm mt-1">
        <p>以下のライブラリを使用しています。</p>
        <List className="mt-2" listStyleType="disc">
          <List.Item>flowbite-react</List.Item>
          <List.Item>overlayscrollbars-react</List.Item>
          <List.Item>react-fast-marquee</List.Item>
          <List.Item>react-icons</List.Item>
          <List.Item>react-youtube</List.Item>
          <List.Item>styled-components</List.Item>
          <List.Item>postcss</List.Item>
          <List.Item>@emotion/react</List.Item>
          <List.Item>@emotion/styled</List.Item>
          <List.Item>@fortawesome/free-brands-svg-icons</List.Item>
          <List.Item>@fortawesome/free-solid-svg-icons</List.Item>
          <List.Item>@fortawesome/react-fontawesome</List.Item>
          <List.Item>@headlessui/react</List.Item>
          <List.Item>@heroicons/react</List.Item>
          <List.Item>@mui/icons-material</List.Item>
          <List.Item>@mui/material</List.Item>
          <List.Item>@mui/styled-engine-sc</List.Item>
          <List.Item>@vercel/analytics</List.Item>
          <List.Item>@vercel/og</List.Item>
          <List.Item>@vercel/speed-insights</List.Item>
          <List.Item>googleapis</List.Item>
        </List>
      </div>

      <h3 className="mt-5 font-semibold">更新履歴</h3>

      <div className="text-sm text-muted">
        <p>
          <Link
            href="https://github.com/mitsugogo/azki-song-db/blob/main/CHANGELOG.md"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub className="inline-block mr-1" />
            CHANGELOG
          </Link>
        </p>
      </div>

      <h3 className="mt-5 font-semibold">管理者</h3>

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
