# AZKi Song Database

> [!NOTE]  
> English README -> [README.md](./README.md)

これは、ホロライブ所属の AZKi さん（バーチャルYouTuber）の楽曲データベースを生成するための Next.js プロジェクトです。

https://azki-song-db.vercel.app/

## 概要

YouTube の楽曲リンクや楽曲情報（タイトル、アーティスト、アルバム等）を管理・閲覧するための Web アプリケーションです。

## 特徴

- YouTube リンク付きの楽曲データベースと豊富なメタデータ（タイトル、アーティスト、アルバム、リリース日、タグ、開始/終了タイムスタンプ など）
- Google Sheets API を利用したデータソースでお手軽管理
- YouTube メタデータ連携および埋め込みプレイヤー
- インスタント検索オーバーレイとフィルター（タイトル、アーティスト、タグ、曲種別）
- ページネーションとフィルタリングを備えた楽曲一覧
- 楽曲詳細ページ（メタデータ、ノート、埋め込みプレイヤー表示）
- プレイリスト管理機能（localStorageに保存）
- プレイヤーコントロール
- モバイル/デスクトップ対応のレスポンシブデザイン
- ライトモード/ダークモードに対応

## データ管理

データは Google スプレッドシートで管理しています。  

テーブル構成の例：

| # | Enabled | Song Title | Artist | Vocalist | Video | start | end | Release Date | tags (comma-separated) | Notes | Milestone |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TRUE | Sample Music | Artist | Singer | Video title | 0:00:00 | | 2025/08/01 | tagA,tagB | Any notes... | Debut MV |

- Video 列は Google Sheets の `HYPERLINK` を使って YouTube へのリンクを埋め込んでください
  - 例: `=HYPERLINK("https://www.youtube.com/watch?v=aA1WjJfRQ3Q","Video title")`


### サンプルシート
コピーしてご利用ください。
https://docs.google.com/spreadsheets/d/1ktXlGFx0xZaCjUxuSRaM6SqIX4_mz8Cm8GpzwqSasY8/edit?usp=sharing

## 開発

1. リポジトリをクローン: `git clone`
2. 依存関係をインストール: `npm install`
3. 開発サーバーを起動: `npm run dev`
4. ブラウザで `http://localhost:3000` を開く

## テスト

このプロジェクトには Vitest（ユニット）と Playwright（E2E）のテストが含まれます。

### 単体テスト（Vitest）

```bash
npm test
npm run test:watch
npm run test:coverage
```

### E2E テスト（Playwright）

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```


## 環境変数

| 変数名 | 説明 |
|---|---|
| `GOOGLE_API_KEY` | Google Sheets API（データ読み取り）|
| `SPREADSHEET_ID` | 使用するスプレッドシートの ID |
| `YOUTUBE_DATA_API_KEY` | YouTube Data API（動画メタデータ取得）|
| `PUBLIC_BASE_URL` | 本番環境のベース URL |

`.env.local` にこれらを設定してください。

Vercelにデプロイする場合は、該当の環境変数をコンソールから設定してください。

## Vercel CDNキャッシュ運用（タグ指定削除）

このプロジェクトの主要データAPIは `Vercel-Cache-Tag` ヘッダを返します。

- `/api/songs`: `dataset:core,songs,songs:list`
- `/api/milestones`: `dataset:core,milestones,milestones:list`
- `/api/yt/channels`: `dataset:core,channels,channels:list`
- `/api/stat/views`: `stat:views,stat:views:list`
- `/api/stat/views/[video_id]`: `stat:views,stat:views:single`

### 手動でタグ指定削除する手順

1. Vercel Project の `Settings` を開く
2. `Caches` を開く
3. `CDN Cache` セクションの `Purge CDN Cache` をクリック
4. `Cache Tag` を選択
5. 削除対象タグ（例: `songs`）を入力して実行

### 推奨戦略

- 通常運用は `Invalidate` を使用（推奨）
- `Delete` は緊急時のみ使用（初回リクエスト遅延やスタンピードを避けるため）
- 既定は `Cache-Control` のTTL + `stale-while-revalidate` を活かし、更新時だけタグ `Invalidate` で即時反映する
- `dataset:core` は複数APIを横断で更新したいときに使用する

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は `LICENSE` を参照してください。
