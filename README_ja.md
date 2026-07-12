# AZKi Song Database

> [!NOTE]  
> English README -> [README.md](./README.md)

これは、ホロライブ所属の AZKi さん（Virtual DiVA）の歌唱楽曲、オリジナル楽曲、カバー楽曲、コラボ楽曲、歌枠セトリ、活動記録、記念日、統計情報をまとめるための非公式ファンサイトです。

https://azki-song-db.vercel.app/

## 概要

Google スプレッドシートで管理した楽曲データをもとに、YouTube の再生、検索、Discography、活動年表、統計、共有用画像生成などを提供する Web アプリケーションです。

## 特徴

- YouTube リンク、開始/終了タイムスタンプ、作詞/作曲/編曲、アルバム、タグ、マイルストーン、ライブノート、コーレス情報を含む楽曲データベース
- Google Sheets API を利用したデータ取得と、日本語/英語表示用のタイトル・アーティスト翻訳マップ
- 埋め込み YouTube プレイヤー、楽曲モード、ランダム再生、お気に入り、ローカル再生数、localStorage プレイリストを備えた視聴ページ
- キーワード検索、カテゴリフィルター、完全一致、AND/OR、除外条件、高度な検索クエリ生成に対応した検索ページ
- オリジナル楽曲、ユニット・ゲスト参加曲、カバー楽曲、アルバム、関連歌枠、YouTube 再生数統計を扱う Discography
- 年別の活動記録、記念日カウントダウン、イベント表示、直近更新、マイルストーン/再生数の概要表示
- 「究極の9曲」ジェネレーターと「あなたのあずきちはどこから？」画像生成などのシェア機能
- PWA、モバイル/デスクトップ対応、ライト/ダークテーマ、QRコード共有、OG画像生成

## データ管理

データは Google スプレッドシートで管理し、Google Sheets API 経由で読み込んでいます。楽曲データのほか、翻訳マップ、マイルストーン、記念日、イベント、チャンネル情報、再生数統計などのシートを利用します。

楽曲シートの基本構成：

| #   | Enabled | Song Title   | Artist | Vocalist | Video       | start   | end | Release Date | tags (comma-separated) | Notes        | Milestone |
| --- | ------- | ------------ | ------ | -------- | ----------- | ------- | --- | ------------ | ---------------------- | ------------ | --------- |
| 1   | TRUE    | Sample Music | Artist | Singer   | Video title | 0:00:00 |     | 2025/08/01   | tagA,tagB              | Any notes... | Debut MV  |

- Video 列は Google Sheets の `HYPERLINK` を使って YouTube へのリンクを埋め込んでください
  - 例: `=HYPERLINK("https://www.youtube.com/watch?v=aA1WjJfRQ3Q","Video title")`
- 追加列として `title_en`, `artist_en`, `album`, `album_en`, `album_release_at`, `album_is_compilation`, `lyricist`, `composer`, `arranger`, `live_call`, `live_note`, `view_count` などに対応しています
- 受け付けるヘッダー名の詳細は `src/app/api/songs/route.tsx` を参照してください


### サンプルシート
コピーしてご利用ください。
https://docs.google.com/spreadsheets/d/1ktXlGFx0xZaCjUxuSRaM6SqIX4_mz8Cm8GpzwqSasY8/edit?usp=sharing

## 動作要件

- Node.js: 24.x
- pnpm: 11.x

## 開発

1. リポジトリをクローン: `git clone`
2. 依存関係をインストール: `pnpm install`
3. `.env.example` を `.env.local` にコピーし、必要な環境変数を設定
4. 開発サーバーを起動: `pnpm dev`
5. ブラウザで `http://localhost:3000` を開く

## テスト

このプロジェクトには Vitest（ユニット）と Playwright（E2E）のテストが含まれます。

### 単体テスト（Vitest）

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### E2E テスト（Playwright）

```bash
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
```


## 環境変数

| 変数名 | 説明 |
|---|---|
| `GOOGLE_API_KEY` | Google Sheets API（データ読み取り）|
| `SPREADSHEET_ID` | 使用するスプレッドシートの ID |
| `YOUTUBE_DATA_API_KEY` | YouTube Data API（動画メタデータ取得） |
| `SAVE_SPREADSHEET_ID` | 「究極の9曲」の共有データ保存先スプレッドシート ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 「究極の9曲」の共有データ書き込みに使うサービスアカウントメール |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | 「究極の9曲」の共有データ書き込みに使うサービスアカウント秘密鍵 |
| `NEXT_PUBLIC_BASE_URL` | 共有URLや内部URL生成に使う公開ベース URL |
| `PUBLIC_BASE_URL` | サーバー側URL生成に使うフォールバックのベース URL |

`.env.local` にこれらを設定してください。

Vercelにデプロイする場合は、該当の環境変数をコンソールから設定してください。

## Vercel CDNキャッシュ運用（タグ指定削除）

このプロジェクトの主要データAPIは `Vercel-Cache-Tag` ヘッダを返します。

- `/api/songs`: `dataset:core,songs,songs:list`
- `/api/milestones`: `dataset:core,milestones,milestones:list`
- `/api/yt/channels`: `dataset:core,channels,channels:list`
- `/api/yt/info`: `yt:info,yt:video`
- `/api/yt/video/[video_id]`: `yt:video,yt:video:{video_id}`
- `/api/events`: `dataset:core,events,events:list`
- `/api/anniversaries`: `dataset:core,milestones,milestones:list`
- `/api/stat/views`: `stat:views,stat:views:list`
- `/api/stat/views/releases`: `stat:views,stat:views:releases`
- `/api/stat/views/[video_id]`: `stat:views,stat:views:single`

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は `LICENSE` を参照してください。
