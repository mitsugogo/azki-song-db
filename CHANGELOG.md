# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.18.0](https://github.com/mitsugogo/azki-song-db/compare/v1.17.1...v1.18.0) (2025-09-28)


### Features

* **main:** 直近更新曲があれば先頭表示 ([2c4d102](https://github.com/mitsugogo/azki-song-db/commit/2c4d102691b78ac86fc7d05c19cb575a965e8cb5))


### Bug Fixes

* **main:** コーレスのタイムスタンプを押しても反応がない場合があったのを修正 ([6fffc13](https://github.com/mitsugogo/azki-song-db/commit/6fffc13fc780e6c52b3ecd71aed887d100a62d19))
* **main:** 特定の解像度で曲一覧がスクロールできない場合があったのを修正 ([fb1195c](https://github.com/mitsugogo/azki-song-db/commit/fb1195c4f996145de0773376425623a02a5b46f7))
* ページロード時にランダム再生で開始しないバグを修正 ([ca801d0](https://github.com/mitsugogo/azki-song-db/commit/ca801d0020a6c4667ab41b25a38b36ce3a3b17e0))

### [1.17.1](https://github.com/mitsugogo/azki-song-db/compare/v1.17.0...v1.17.1) (2025-09-27)


### Bug Fixes

* pvidの廃止 ([df5e40a](https://github.com/mitsugogo/azki-song-db/commit/df5e40a675a47de1c009b383fb220fed944d986a))
* URLパラメータでvideo_idの指定がうまく動いてなかったのを修正 ([815bdfb](https://github.com/mitsugogo/azki-song-db/commit/815bdfbfb8cf61b82ae3402275fb0084e823aa1e))

## [1.17.0](https://github.com/mitsugogo/azki-song-db/compare/v1.16.4...v1.17.0) (2025-09-27)


### Features

* **main:** Spotlight検索に対応 ([0847874](https://github.com/mitsugogo/azki-song-db/commit/0847874dd6a742ebfe9c69022f9fd006f2ae9564))


### Bug Fixes

* **main:** ページ遷移時に最上部要素にならない場合があったのを修正 ([214c0c8](https://github.com/mitsugogo/azki-song-db/commit/214c0c8a237b5163598b4f1056f234a7b8126f83))
* **main:** 動画下のサムネイルが小さいものが選択される場合があったのを修正 ([0ffd100](https://github.com/mitsugogo/azki-song-db/commit/0ffd100eb39c57d1a3b80d48dce744bbd1fed502))
* **main:** 曲詳細のバッジを押した時に消えないバグを修正 ([4c31c68](https://github.com/mitsugogo/azki-song-db/commit/4c31c68415d629b4fca7835a0ef68b66bd848d78))
* **main:** 特定画面サイズの時にプレイリスト追加が出来なかったのを修正 ([928231e](https://github.com/mitsugogo/azki-song-db/commit/928231e838f7b57584d49677be537428cea8ca38))

### [1.16.4](https://github.com/mitsugogo/azki-song-db/compare/v1.16.3...v1.16.4) (2025-09-25)


### Bug Fixes

* **stat:** タブを切り替えた時に表が表示されないことがあるのを修正 ([42a9518](https://github.com/mitsugogo/azki-song-db/commit/42a95185886b1e0a1b0678d01c1f4238d03932f4))

### [1.16.3](https://github.com/mitsugogo/azki-song-db/compare/v1.16.2...v1.16.3) (2025-09-25)


### Bug Fixes

* ソロライブモード切り替え時にプレイリストがバグって次の曲に行かない場合があったのを修正 ([4a4cfe1](https://github.com/mitsugogo/azki-song-db/commit/4a4cfe122df1f0d66fdb6dac2f685b99f01dbdd4))
* ライト/ダークモードが連動しない場合があったのを修正 ([c3d34d4](https://github.com/mitsugogo/azki-song-db/commit/c3d34d4c29a2ea4b7546ae928a34c0831437d5a5))

### [1.16.2](https://github.com/mitsugogo/azki-song-db/compare/v1.16.1...v1.16.2) (2025-09-23)

### [1.16.1](https://github.com/mitsugogo/azki-song-db/compare/v1.16.0...v1.16.1) (2025-09-23)


### Bug Fixes

* **playlist:** D&Dが邪魔して曲の削除が出来ないバグを修正 ([add29cf](https://github.com/mitsugogo/azki-song-db/commit/add29cf030cfa457183271167f1514592e888e08))

## [1.16.0](https://github.com/mitsugogo/azki-song-db/compare/v1.15.1...v1.16.0) (2025-09-23)


### Features

* プレイリスト機能を追加 [#152](https://github.com/mitsugogo/azki-song-db/issues/152) ([b306fdd](https://github.com/mitsugogo/azki-song-db/commit/b306fddece3189e151a4c09cd9ecc5cb3554e45a))


### Bug Fixes

* 新規プレイリストモーダルが出たときにメニューが閉じないバグを修正 ([9a14a69](https://github.com/mitsugogo/azki-song-db/commit/9a14a69fcdf9abf3e061259fa4bd54c26b5cea60))

### [1.15.1](https://github.com/mitsugogo/azki-song-db/compare/v1.15.0...v1.15.1) (2025-09-21)


### Bug Fixes

* 日付検索が出来ないバグを修正 ([e01d8b3](https://github.com/mitsugogo/azki-song-db/commit/e01d8b3c737fa8d76267bf0ac9dbc622cb396a4f))

## [1.15.0](https://github.com/mitsugogo/azki-song-db/compare/v1.14.0...v1.15.0) (2025-09-21)


### Features

* 季節の絞り込みに対応 ([b43c09e](https://github.com/mitsugogo/azki-song-db/commit/b43c09e77a6bba705caf7590d7e02653c02456cc))

## [1.14.0](https://github.com/mitsugogo/azki-song-db/compare/v1.13.4...v1.14.0) (2025-09-21)


### Features

* **main:** ライブコール練習用機能を追加 ([e916dac](https://github.com/mitsugogo/azki-song-db/commit/e916dac5ef91bf363dfacdd3e008aa4269456555))

### [1.13.4](https://github.com/mitsugogo/azki-song-db/compare/v1.13.3...v1.13.4) (2025-09-18)


### Bug Fixes

* **stats:** tableの横幅がいっぱいにならないバグを修正 ([61e1f47](https://github.com/mitsugogo/azki-song-db/commit/61e1f47d50f09784bf58b0f9e9945f83bc651bbc))

### [1.13.3](https://github.com/mitsugogo/azki-song-db/compare/v1.13.2...v1.13.3) (2025-09-17)


### Bug Fixes

* **discography:** オリ曲、ユニット楽曲の判定を調整 ([3de6bec](https://github.com/mitsugogo/azki-song-db/commit/3de6becee466aad2307c9fb47ba26af68d585ef4))

### [1.13.2](https://github.com/mitsugogo/azki-song-db/compare/v1.13.1...v1.13.2) (2025-09-17)

### [1.13.1](https://github.com/mitsugogo/azki-song-db/compare/v1.13.0...v1.13.1) (2025-09-17)


### Bug Fixes

* **main:** スマホで異様にサムネがでかいのを修正 ([546c6ac](https://github.com/mitsugogo/azki-song-db/commit/546c6ac11fa5fa6739b754a43a99411ede2aa956))

## [1.13.0](https://github.com/mitsugogo/azki-song-db/compare/v1.12.6...v1.13.0) (2025-09-17)


### Features

* **main:** 検索BOXのリデザイン ([4bd321b](https://github.com/mitsugogo/azki-song-db/commit/4bd321bb35c6e1e90a2812785e7d25582f7d8d52))


### Bug Fixes

* OGの曲判定バグ修正 ([20ba0b1](https://github.com/mitsugogo/azki-song-db/commit/20ba0b1fc4ee63be3c2cb857762d85c540d6fa57))

### [1.12.6](https://github.com/mitsugogo/azki-song-db/compare/v1.12.5...v1.12.6) (2025-09-17)


### Bug Fixes

* **stats:** iOS26で下が若干見切れるのを修正 ([879cde0](https://github.com/mitsugogo/azki-song-db/commit/879cde0c73266bb091657ecb854e56c24b6bc4a6))
* あずいろオリ曲リリースに備えて判定を調整 ([9d83468](https://github.com/mitsugogo/azki-song-db/commit/9d83468fc58090673d804244b992e87256de5958))

### [1.12.5](https://github.com/mitsugogo/azki-song-db/compare/v1.12.4...v1.12.5) (2025-09-16)


### Bug Fixes

* メニューリンク変更 ([5008fc0](https://github.com/mitsugogo/azki-song-db/commit/5008fc04312aee928ea3f6c53f946c8a7c8b53f3))

### [1.12.4](https://github.com/mitsugogo/azki-song-db/compare/v1.12.3...v1.12.4) (2025-09-16)


### Bug Fixes

* **data:** iOS26で縦方向にはみ出るのを修正 ([86eb0d4](https://github.com/mitsugogo/azki-song-db/commit/86eb0d435820ee3cdbc83a2e51fdb4b2ea33a803))

### [1.12.3](https://github.com/mitsugogo/azki-song-db/compare/v1.12.2...v1.12.3) (2025-09-16)

### [1.12.2](https://github.com/mitsugogo/azki-song-db/compare/v1.12.1...v1.12.2) (2025-09-15)


### Bug Fixes

* **main:** 除外条件が誤爆する場合があったのを修正 ([b0a3449](https://github.com/mitsugogo/azki-song-db/commit/b0a3449e21d65e559691672cad245403edfb4141))

### [1.12.1](https://github.com/mitsugogo/azki-song-db/compare/v1.12.0...v1.12.1) (2025-09-15)


### Bug Fixes

* ダークモード判定バグ修正 ([1a5b332](https://github.com/mitsugogo/azki-song-db/commit/1a5b33278c276a92ae3e15c31b70913e279df02f))

## [1.12.0](https://github.com/mitsugogo/azki-song-db/compare/v1.11.2...v1.12.0) (2025-09-15)


### Features

* **disco:** ユニット楽曲を分離 ([f294ccc](https://github.com/mitsugogo/azki-song-db/commit/f294ccc38dd38642fb9177df9b526a74b673409f))
* **stats:** 再生数達成時にラベルを表示 ([12a512a](https://github.com/mitsugogo/azki-song-db/commit/12a512a6c3b608534a31c2c6b4979d20aa42faea))
* 主要な箇所をMantineに置き換え ([ac8a2bb](https://github.com/mitsugogo/azki-song-db/commit/ac8a2bbc617aa21492e3e850aba0a939aee02f00))


### Bug Fixes

* **disco:** カバーしたホロメンが全員出ない場合があったのを修正 ([e72130b](https://github.com/mitsugogo/azki-song-db/commit/e72130b79be9629a6b980ef9ce5250746da3246d))
* **disco:** タブ切り替え時に戻るとエラーになる場合があったのを修正 ([c06f920](https://github.com/mitsugogo/azki-song-db/commit/c06f9205f34021e27554a9ff4f79b00d0813e02f))
* **disco:** 最終行の要素の詳細が表示されないバグを修正 ([2d7014f](https://github.com/mitsugogo/azki-song-db/commit/2d7014fc881d7546080aaffa2e0d33fbac0b9723))
* **main:** ソロライブモードの時は初回ロード時にCreating worldから始める ([06de502](https://github.com/mitsugogo/azki-song-db/commit/06de5023c35bba1055bf086d1b29faec422d36ed))

### [1.11.2](https://github.com/mitsugogo/azki-song-db/compare/v1.11.1...v1.11.2) (2025-09-14)

### [1.11.1](https://github.com/mitsugogo/azki-song-db/compare/v1.11.0...v1.11.1) (2025-09-14)


### Bug Fixes

* **main:** 備考欄で日本語URLを解釈できなかったのを修正 ([ba409ca](https://github.com/mitsugogo/azki-song-db/commit/ba409ca4591a859819fe15c3289e107487a466e7))

## [1.11.0](https://github.com/mitsugogo/azki-song-db/compare/v1.10.3...v1.11.0) (2025-09-14)


### Features

* **main:** ソロライブ予習モード ([3d15b18](https://github.com/mitsugogo/azki-song-db/commit/3d15b18ea153232c9958da79d1bc76ebbd95c74f))

### [1.10.3](https://github.com/mitsugogo/azki-song-db/compare/v1.10.2...v1.10.3) (2025-09-14)

### [1.10.2](https://github.com/mitsugogo/azki-song-db/compare/v1.10.1...v1.10.2) (2025-09-13)


### Bug Fixes

* **data:** Safariでの表示崩れを修正 ([c042976](https://github.com/mitsugogo/azki-song-db/commit/c042976153215db1cf6a1deccba0fadf692e1038))

### [1.10.1](https://github.com/mitsugogo/azki-song-db/compare/v1.10.0...v1.10.1) (2025-09-13)


### Bug Fixes

* **disco:** ホバー時のアルバム発売日が誤っている場合があるのを修正 ([0e56dbf](https://github.com/mitsugogo/azki-song-db/commit/0e56dbf56b0c4ade3e7926772494a54e9e0e5444))

## [1.10.0](https://github.com/mitsugogo/azki-song-db/compare/v1.9.0...v1.10.0) (2025-09-13)


### Features

* **stat:**  動画のセトリを表示する機能を追加 fixed [#122](https://github.com/mitsugogo/azki-song-db/issues/122) ([27765f5](https://github.com/mitsugogo/azki-song-db/commit/27765f57aec0ab9eb4099c1ed2d535be2c9674e9))
* **stat:** アルバムや動画の詳細を表示する機能を追加 ([60c220c](https://github.com/mitsugogo/azki-song-db/commit/60c220c7a199b6eef8a5c2c6c8cc2e551ca5331d))

## [1.9.0](https://github.com/mitsugogo/azki-song-db/compare/v1.8.2...v1.9.0) (2025-09-12)


### Features

* **stat:** オリ曲とカバー曲の再生数表示 ([9069c99](https://github.com/mitsugogo/azki-song-db/commit/9069c9999cd2fceeec62218565139a2236d3c904))


### Bug Fixes

* **data:** 全収録データページの軽量化 ([ef6f974](https://github.com/mitsugogo/azki-song-db/commit/ef6f974447400c51e4150857823ff21ecfeb768a))
* **stat:** 同一曲を別の方とカバーしたときに同一動画扱いされていたのを修正 ([1959315](https://github.com/mitsugogo/azki-song-db/commit/1959315f9d61027cd05e8a2861676472bc87e030))

### [1.8.2](https://github.com/mitsugogo/azki-song-db/compare/v1.8.1...v1.8.2) (2025-09-11)


### Bug Fixes

* **data:** ダークモード時の色がやばいので削除 ([425c745](https://github.com/mitsugogo/azki-song-db/commit/425c7454a4aed3616585158433a776c5e737e951))

### [1.8.1](https://github.com/mitsugogo/azki-song-db/compare/v1.8.0...v1.8.1) (2025-09-11)


### Bug Fixes

* シェアボタン修正 ([69fa0d6](https://github.com/mitsugogo/azki-song-db/commit/69fa0d6442b4bf7796e52cc2d63594dbbaf8e95e))

## [1.8.0](https://github.com/mitsugogo/azki-song-db/compare/v1.7.2...v1.8.0) (2025-09-11)


### Features

* **data:** 全データ公開 ([b911ef9](https://github.com/mitsugogo/azki-song-db/commit/b911ef99b24ec63494d86fcd637a66f6bc7b1a9a))


### Bug Fixes

* **main:** shortsに対応 [#121](https://github.com/mitsugogo/azki-song-db/issues/121) ([4e63f45](https://github.com/mitsugogo/azki-song-db/commit/4e63f45c3c1a1a8b445375f8fb1f8d315dd03375))

### [1.7.2](https://github.com/mitsugogo/azki-song-db/compare/v1.7.1...v1.7.2) (2025-09-10)


### Bug Fixes

* **main:** 曲名部分がスクロールしない場合があったのを修正 fixed [#119](https://github.com/mitsugogo/azki-song-db/issues/119) ([9624156](https://github.com/mitsugogo/azki-song-db/commit/96241568ad1621f0489378d43f772d5690f98d5b))

### [1.7.1](https://github.com/mitsugogo/azki-song-db/compare/v1.7.0...v1.7.1) (2025-09-09)

## [1.7.0](https://github.com/mitsugogo/azki-song-db/compare/v1.6.0...v1.7.0) (2025-09-07)


### Features

* セトリネタバレ防止機能 ([db59e33](https://github.com/mitsugogo/azki-song-db/commit/db59e33a20af3526fe53384c8f50243d898f75e3))

## [1.6.0](https://github.com/mitsugogo/azki-song-db/compare/v1.5.0...v1.6.0) (2025-09-03)


### Features

* OGP画像の曲名と動画名の表示対応 ([9a0c775](https://github.com/mitsugogo/azki-song-db/commit/9a0c7750d792a4102c5236666ef1f60c0ab26c82))

## [1.5.0](https://github.com/mitsugogo/azki-song-db/compare/v1.4.0...v1.5.0) (2025-09-02)


### Features

* こっそり収録データ一覧ページを追加 ([597e9ae](https://github.com/mitsugogo/azki-song-db/commit/597e9aec658e22e81e7a4a7c4358c64ad53bbdf8))

## [1.4.0](https://github.com/mitsugogo/azki-song-db/compare/v1.3.0...v1.4.0) (2025-09-01)


### Features

* discographyページを追加 ([dc55899](https://github.com/mitsugogo/azki-song-db/commit/dc558990c8180527899739b2fedf732f1b1b0c0e))


### Bug Fixes

* **discography:** ディスコグラフィページのリデザイン ([3cc655e](https://github.com/mitsugogo/azki-song-db/commit/3cc655e9c2652c17ac1a386a000000e2c378849f))
* **main:** ページ遷移で特定の楽曲が増殖するバグを修正 (fixed [#101](https://github.com/mitsugogo/azki-song-db/issues/101)) ([0d02491](https://github.com/mitsugogo/azki-song-db/commit/0d024913393b745b70eb03fbe666ba016c15eba4))
* **main:** ページ遷移で特定の楽曲が増殖するバグを修正 (fixed [#101](https://github.com/mitsugogo/azki-song-db/issues/101)) ([9b74b61](https://github.com/mitsugogo/azki-song-db/commit/9b74b613e7574e0fa61be7e930e3b81a55b8ef76))
* **main:** 検索時にヒットした楽曲が表示されないことがあったのを修正 ([610e335](https://github.com/mitsugogo/azki-song-db/commit/610e335ba911f2598fa0fdea434d58495c30a6b7))
* **main:** 高解像度モニタでも画面いっぱいに表示するように ([11758f7](https://github.com/mitsugogo/azki-song-db/commit/11758f7fadb8a4e5795eb9ceae7a211c3bb40f38))
* **stats:** データの持ち方の変更に伴う条件変更 ([c9d0b25](https://github.com/mitsugogo/azki-song-db/commit/c9d0b25527cea2b11a93dae1ceeadeee1b57aaa0))
* **stats:** デフォルトをアルバム毎の表示に ([736d0d5](https://github.com/mitsugogo/azki-song-db/commit/736d0d5178c5c9e9624cb169c6a0d099f15758fb))
* データの持ち方調整によるソート順を修正 ([02a1e7d](https://github.com/mitsugogo/azki-song-db/commit/02a1e7ded64f91bc72090ac756dcf9cf02cb4dda))

## [1.3.0](https://github.com/mitsugogo/azki-song-db/compare/v1.2.0...v1.3.0) (2025-08-31)


### Features

* **stats:** タブ切り替えでURLが変わるように ([faedf5d](https://github.com/mitsugogo/azki-song-db/commit/faedf5d2574adcb3d372ddc39d6d2a4048d1d7c5))


### Bug Fixes

* **statistics:** Discographyに一部のオリ曲が出ないバグを修正 ([5c1375b](https://github.com/mitsugogo/azki-song-db/commit/5c1375b9e465b6e3dfec01a5791a74195e894bc4))
* 統計情報のタイトルタグ調整 ([c9faa95](https://github.com/mitsugogo/azki-song-db/commit/c9faa950be2ae1de266193e01815f3698607bce2))

## [1.2.0](https://github.com/mitsugogo/azki-song-db/compare/v1.1.0...v1.2.0) (2025-08-30)


### Features

* **statistics:** カバー曲リストを追加 ([901d173](https://github.com/mitsugogo/azki-song-db/commit/901d1734cff233741870687414c50d3992e01dfd))

## [1.1.0](https://github.com/mitsugogo/azki-song-db/compare/v1.0.2...v1.1.0) (2025-08-30)


### Features

* **statistics:** Discographyを追加 ([62ed3ee](https://github.com/mitsugogo/azki-song-db/commit/62ed3eeacbea2b2f98f558104218a8a207a1b2fc))

### [1.0.2](https://github.com/mitsugogo/azki-song-db/compare/v1.0.1...v1.0.2) (2025-08-30)


### Bug Fixes

* iOSなどでinputフォーカス時にズームしないように ([5a8c1c0](https://github.com/mitsugogo/azki-song-db/commit/5a8c1c0e9f625b0e9f4310ae17cea7ed605a375c))

### [1.0.1](https://github.com/mitsugogo/azki-song-db/compare/v1.0.0...v1.0.1) (2025-08-30)


### Bug Fixes

* **about:** このサイトについての文言調整 ([096ced5](https://github.com/mitsugogo/azki-song-db/commit/096ced53c54df5b93139859b31ce645b7ca0c592))
* **statistics:** デフォルトソートを明示するように ([1da2801](https://github.com/mitsugogo/azki-song-db/commit/1da2801cacb872ececa521b2347fd389942bd2b2))
* **statistics:** 最新動画が最新のものじゃないバグを修正 ([eed7a86](https://github.com/mitsugogo/azki-song-db/commit/eed7a86b78f4ece78b0054c652aa1bf384203021))

## [1.0.0](https://github.com/mitsugogo/azki-song-db/compare/v0.2.0...v1.0.0) (2025-08-29)

## [0.2.0](https://github.com/mitsugogo/azki-song-db/compare/v0.1.12...v0.2.0) (2025-08-29)


### ⚠ BREAKING CHANGES

* 正式リリース

### Features

* 正式リリース ([582d065](https://github.com/mitsugogo/azki-song-db/commit/582d065908ae16a929d1c7cdd83be002b1cb2ffe))


### Bug Fixes

* コメント微調整 ([a57f517](https://github.com/mitsugogo/azki-song-db/commit/a57f517b7fa689fa91180676a4c64890b5f5875f))

### [0.1.12](https://github.com/mitsugogo/azki-song-db/compare/v0.1.11...v0.1.12) (2025-08-29)


### Features

* **vercel-tools:** add vercel tools ([257632e](https://github.com/mitsugogo/azki-song-db/commit/257632edf7386d88b9f7b715798ae54e8d30a263))


### Bug Fixes

* **statistics:** レイアウト崩れ調整 ([490d958](https://github.com/mitsugogo/azki-song-db/commit/490d958a049e857ce37cd8b66c5faa3472006bac))
* 統計情報で一部のリンクが無くなっていたのを修正 ([d8ef87a](https://github.com/mitsugogo/azki-song-db/commit/d8ef87a644af415b77d65059861a2c9f888adae9))

### [0.1.11](https://github.com/mitsugogo/azki-song-db/compare/v0.1.10...v0.1.11) (2025-08-28)


### Bug Fixes

* 入力が重いのを調整 ([7d1889e](https://github.com/mitsugogo/azki-song-db/commit/7d1889e7259950f69bdc926a9a53c25a9314e61b))
* 検索ワードが機能しない場合があったのを修正 ([624ac43](https://github.com/mitsugogo/azki-song-db/commit/624ac43e919066a56a9872ca0014099f4d7158c8))

### [0.1.10](https://github.com/mitsugogo/azki-song-db/compare/v0.1.9...v0.1.10) (2025-08-28)


### Features

* 「収録動画一覧」を追加 ([4d28d6f](https://github.com/mitsugogo/azki-song-db/commit/4d28d6f516d04263420d16771f7d7f395886aae7))

### [0.1.9](https://github.com/mitsugogo/azki-song-db/compare/v0.1.8...v0.1.9) (2025-08-26)


### Features

* 統計情報のtableで検索・ソートが出来るように ([b316b68](https://github.com/mitsugogo/azki-song-db/commit/b316b68a701d1e30c5fdb2ac9f9186c47d697fd1))

### [0.1.8](https://github.com/mitsugogo/azki-song-db/compare/v0.1.7...v0.1.8) (2025-08-25)


### Bug Fixes

* 再生開始した動画から2曲目に行くと開始曲に戻れないバグを修正 [#83](https://github.com/mitsugogo/azki-song-db/issues/83) ([71ac0b8](https://github.com/mitsugogo/azki-song-db/commit/71ac0b8bc053a2a97d503fd3c8fe850a8fa87d26))

### [0.1.7](https://github.com/mitsugogo/azki-song-db/compare/v0.1.6...v0.1.7) (2025-08-24)


### Bug Fixes

* カラーテーマ "system" が保存されないバグを修正 ([cd0945e](https://github.com/mitsugogo/azki-song-db/commit/cd0945e5cff9325cbf1ac4b94a7dd74d939867d6))
* ロード時に前後の曲がセットされてない不具合を修正 ([3c6a88d](https://github.com/mitsugogo/azki-song-db/commit/3c6a88d49082daf6c97f8f587c58f11ad77214ea))

### [0.1.6](https://github.com/mitsugogo/azki-song-db/compare/v0.1.5...v0.1.6) (2025-08-24)


### Features

* PWA対応 ([b1232a3](https://github.com/mitsugogo/azki-song-db/commit/b1232a31a8e4b61ccbd52f80ef84105d0cbb2ae6))

### [0.1.5](https://github.com/mitsugogo/azki-song-db/compare/v0.1.4...v0.1.5) (2025-08-23)


### Bug Fixes

* 曲リストをどのレイアウトでも切りの良いタイル数に変更 ([1d4864f](https://github.com/mitsugogo/azki-song-db/commit/1d4864f40cd2894af3966d4b798cd21639cfbd1e))

### [0.1.4](https://github.com/mitsugogo/azki-song-db/compare/v0.1.3...v0.1.4) (2025-08-23)

### 0.1.3 (2025-08-23)


### Features

* OGPに検索クエリ反映 ([9b60078](https://github.com/mitsugogo/azki-song-db/commit/9b60078f0e7e4959d9dd4fbcd5c186b5a3099b27))
* OS連動のダークモードボタンを追加 ([0c1bb23](https://github.com/mitsugogo/azki-song-db/commit/0c1bb23a9c4fe727c42a91257a81238f73cc3c56))
* マイルストーンタブを追加 ([d61c470](https://github.com/mitsugogo/azki-song-db/commit/d61c47005a5f5478aaa3889f0bb79809905436a8))
* マイルストーンに対応 ([cf9ff58](https://github.com/mitsugogo/azki-song-db/commit/cf9ff58242ee32a6fd48b4a09e4b84df35929a6f))
* マイルストーンバッジをclickで検索可能に ([6a065d5](https://github.com/mitsugogo/azki-song-db/commit/6a065d558f08c0f392f54afc481d052e4f6028c9))
* モバイル時のレイアウトを見直し ([15d276c](https://github.com/mitsugogo/azki-song-db/commit/15d276c25b384437d9b3e843326363685fcd7e9c))
* 検索のタグ化 ([37532df](https://github.com/mitsugogo/azki-song-db/commit/37532df881dc15f63f9814ffa5c6238de30d6643))
* 現在の歌枠に残る機能 ([f15684a](https://github.com/mitsugogo/azki-song-db/commit/f15684a8bd2a62dac638367c97d462e99ad592fc))
* 統計情報の実装、伴ったレイアウト見直し ([6dacdf2](https://github.com/mitsugogo/azki-song-db/commit/6dacdf2ab4546ad15d199f9dda23e65a1c4677c3))
* 高度な検索にマイルストーンを追加 ([e6759b1](https://github.com/mitsugogo/azki-song-db/commit/e6759b17f71895ca8802426d0f1063ca4b1ecf29))
* 高度な検索機能 ([ff8ee2a](https://github.com/mitsugogo/azki-song-db/commit/ff8ee2a108617e7eae7f1dca52e6ac7b1502e69e))


### Bug Fixes

* 「オリ曲」の歌唱数の算出を調整 ([ea7af17](https://github.com/mitsugogo/azki-song-db/commit/ea7af17cd39aeb3684b8a0b66d669307bac57709))
* 50件→200件 ([194f06b](https://github.com/mitsugogo/azki-song-db/commit/194f06b1e48e7ea997fc0e4300a7526d489b04f1))
* add key ([f907650](https://github.com/mitsugogo/azki-song-db/commit/f907650eeaaa3e1cde6fefdf2b97ed4769823c6c))
* Analytics系をlayoutに配置 ([0289ae7](https://github.com/mitsugogo/azki-song-db/commit/0289ae7af796aaabb46e567a091968bd7e0ce1c7))
* autocompleteエリアの高さ調整 ([fe3e4b0](https://github.com/mitsugogo/azki-song-db/commit/fe3e4b060de56d812a40ae5321cc066ae14c2444))
* Autocomplete改善 ([b21ad4e](https://github.com/mitsugogo/azki-song-db/commit/b21ad4ed51e4c983cb9ad229779e8b9d95b54b98))
* comment ([24a4de0](https://github.com/mitsugogo/azki-song-db/commit/24a4de0aa942215d8f1de4993b2f44e3ef4d6165))
* darkモードでボタン影削除 ([cd8ee50](https://github.com/mitsugogo/azki-song-db/commit/cd8ee50d8923acdf4cea0b37f91156bd94ebd1f2))
* darkモード切り替えボタンのhover調整 ([e0e5c82](https://github.com/mitsugogo/azki-song-db/commit/e0e5c82770c4cbde2e639280e2e483f08a898803))
* deprecated対応 ([ba14ac0](https://github.com/mitsugogo/azki-song-db/commit/ba14ac0311ae4f9e1878e51b86c2eef22b3f7d4b))
* ESlint ([faea2fd](https://github.com/mitsugogo/azki-song-db/commit/faea2fda92296acb054ebfaed4825e8985872494))
* ESlint ([9bb6733](https://github.com/mitsugogo/azki-song-db/commit/9bb6733771856dd284b9615fa25a4fba101d667c))
* ESlint ([a1d01b4](https://github.com/mitsugogo/azki-song-db/commit/a1d01b4c5974b82ece9b1cdc328d657cded5a216))
* ESlint ([1be1fdc](https://github.com/mitsugogo/azki-song-db/commit/1be1fdc42ff5949f15b909ca3a4254a7e0f77972))
* ESlint ([cdc1cb0](https://github.com/mitsugogo/azki-song-db/commit/cdc1cb0a02f7a795a4e6d03b4532e1c03d86d862))
* index位置バグ修正 ([36be834](https://github.com/mitsugogo/azki-song-db/commit/36be834f4062ad1b9eb672c74ef05cf1ac6f99d4))
* iOSでの表示くずれ対応 ([bbe85b9](https://github.com/mitsugogo/azki-song-db/commit/bbe85b9541b68f32061c4e7ad8669f5c2a69804c))
* mdサイズ時の高さ調整 ([e51f787](https://github.com/mitsugogo/azki-song-db/commit/e51f787a5a1743512222209f394e5436bcafe28f))
* md時にレイアウトが厳しくなるのを修正 ([71b543c](https://github.com/mitsugogo/azki-song-db/commit/71b543c0b97ae34d115148563c8d1b1a98dedb19))
* og ([f70d99f](https://github.com/mitsugogo/azki-song-db/commit/f70d99ffae12a0c3fb1eff620fb7f479f265676d))
* OGP処理修正 ([f21c17b](https://github.com/mitsugogo/azki-song-db/commit/f21c17b7902b66e79db4a73046c3f71f63221b96))
* og修正 ([c05bb54](https://github.com/mitsugogo/azki-song-db/commit/c05bb5411866bd99ee4dd8651661a58768ecf677))
* OSのテーマに追従するモード ([347a8a8](https://github.com/mitsugogo/azki-song-db/commit/347a8a810321b99f9bd9158923de87cbea5f6468))
* q=検索ワードのアクセスが喪失するのを修正 ([6207927](https://github.com/mitsugogo/azki-song-db/commit/6207927b43e14d448625dfc0617adaf0f83dbe9f))
* reformat ([c54b8cd](https://github.com/mitsugogo/azki-song-db/commit/c54b8cdc6afd5f28b4be77d91ccd82384e823dc5))
* tabに指定できる文字列の厳格化 ([135d164](https://github.com/mitsugogo/azki-song-db/commit/135d1644c1f4307aeadcdced4a45b1454a618c5a))
* tailwind CSS v4準拠 ([9f52fc7](https://github.com/mitsugogo/azki-song-db/commit/9f52fc775a84ea435ebfa5b4268571668d6dd409))
* timerのクリア処理を調整 ([c5ad3b9](https://github.com/mitsugogo/azki-song-db/commit/c5ad3b9c3cb9b5b4f9d9c68d905d22bd5b81c141))
* tooltipがうまく出ないので削除 ([f777f68](https://github.com/mitsugogo/azki-song-db/commit/f777f687842691d2568f3a1ff3dcfd1fcff828ae))
* URLのタブ番号が保持されないバグを修正 ([f272989](https://github.com/mitsugogo/azki-song-db/commit/f27298926694dfcf8ba714b6f40a4582047c64cc))
* vercelの上限対策 ([8670012](https://github.com/mitsugogo/azki-song-db/commit/8670012be42f0bb267e899466f98b8c5633cfb11))
* workflow ([c3b7324](https://github.com/mitsugogo/azki-song-db/commit/c3b732458319c5f66966d8df11efa46e3b31c6ae))
* workflow ([71d2f8d](https://github.com/mitsugogo/azki-song-db/commit/71d2f8d8d8372557982d85638911a2fb2d477134))
* workflow ([66b69b8](https://github.com/mitsugogo/azki-song-db/commit/66b69b89b87ccee7cde6cb0041c54f3fff84cfa6))
* workflow権限追加忘れ ([781465a](https://github.com/mitsugogo/azki-song-db/commit/781465ac7a704b8eb9767959a9d505f2e26d5dea))
* workflow置き場所間違えてた... ([1982d2d](https://github.com/mitsugogo/azki-song-db/commit/1982d2d21a28db3125f235366c592741d89eb8fc))
* workflow調整 ([2eec005](https://github.com/mitsugogo/azki-song-db/commit/2eec0053ff82d8489b099c2c290e8e6c0f2ae8c1))
* YouTubeのID仕様によるURL判定調整 ([3f5c95b](https://github.com/mitsugogo/azki-song-db/commit/3f5c95bfe3b2d80d3fb2e0c444305ee85a490582))
* YouTubeのサムネイル画像読み込みエラー判定を調整 ([fb5a555](https://github.com/mitsugogo/azki-song-db/commit/fb5a555fab6cd0301bb3e355b95a35ce945478e8))
* エラーハンドル調整 ([3f3644c](https://github.com/mitsugogo/azki-song-db/commit/3f3644c47c1ef5c8bb3668f76a9401f3f102a980))
* サムネイル表示によるスクロール位置ズレ調整 ([82d5d2e](https://github.com/mitsugogo/azki-song-db/commit/82d5d2efc8ec7b25ac9422a3758d2d5e6f5a3d56))
* スクロール処理調整 ([1b8c1d4](https://github.com/mitsugogo/azki-song-db/commit/1b8c1d45347a5c29f085473a56c2d8df0be93455))
* スマホでは縦領域が厳しいのでフッターを削除 ([f754375](https://github.com/mitsugogo/azki-song-db/commit/f7543759998c658847adfc3b87250eb75c45dabb))
* スマホで上下にスクロールするバグを調整してみた ([335b87f](https://github.com/mitsugogo/azki-song-db/commit/335b87fcf26a3fa104a363076cba5a422f6c4e65))
* スライスするときに何故かページ番号いれてた… ([07f4b2e](https://github.com/mitsugogo/azki-song-db/commit/07f4b2eac5d88d393ad7081732d4c1a13a997167))
* ダークモードで曲詳細のどのbadgeが活性かわからないのを修正 ([9d3abbb](https://github.com/mitsugogo/azki-song-db/commit/9d3abbb72e9528b3ba20fd6787d96e92ce9c2c32))
* ダークモードの背景を1段階暗くした ([060002f](https://github.com/mitsugogo/azki-song-db/commit/060002fcb97e30c3e44ef3b4ee2d2746cf511c67))
* タイムスタンプが1つのみの場合は非表示 ([86487d2](https://github.com/mitsugogo/azki-song-db/commit/86487d2781968d34a3e9280802f3ce93033682c5))
* タイムスタンプを展開式に ([e4fe0b0](https://github.com/mitsugogo/azki-song-db/commit/e4fe0b0f7d1940c43bdb37eee97bea222ad7f237))
* テーマのトグルボタンのエラー修正 ([0451e4b](https://github.com/mitsugogo/azki-song-db/commit/0451e4b6c3d9ab06c0c94dd718d781b597b65c42))
* ページャーバグ修正 ([0c04fe1](https://github.com/mitsugogo/azki-song-db/commit/0c04fe1e816430c62eaebd73a23713adc8cb9c4d))
* ページャーを入れたことでスクロールが出来なくなったのを修正 ([f60d1fb](https://github.com/mitsugogo/azki-song-db/commit/f60d1fb5a610338b464597cbae88188da20199ad))
* ページ番号からのindex計算ミス修正 ([e892690](https://github.com/mitsugogo/azki-song-db/commit/e89269065445170c60b856cd3484268e1feeaa63))
* ボタンの角丸調整 ([36f5fa9](https://github.com/mitsugogo/azki-song-db/commit/36f5fa9d87d9d3a2bcc131cdaeea76770cf312e8))
* マイルストーンバッジ ([b2746e0](https://github.com/mitsugogo/azki-song-db/commit/b2746e069a5be0411fb5d672a880dd8d03e04659))
* モバイルメニュー調整 ([5ff3601](https://github.com/mitsugogo/azki-song-db/commit/5ff36013e5c6e2d251a80a3d2aaa931017aaaaee))
* レイアウト微調整 ([e0d0e67](https://github.com/mitsugogo/azki-song-db/commit/e0d0e67faba544b04402a7888507bdd5a45a04c7))
* レイアウト微調整 ([e49ec49](https://github.com/mitsugogo/azki-song-db/commit/e49ec496bcb097a8d950947ef45034b5c97a1495))
* レイアウト微調整 ([7a8f113](https://github.com/mitsugogo/azki-song-db/commit/7a8f11363037649c338ec95b8ebc16d45968a995))
* レイアウト微調整 ([ea037f9](https://github.com/mitsugogo/azki-song-db/commit/ea037f94774122845e50af52e4482cc927a113a2))
* レイアウト調整 ([494db07](https://github.com/mitsugogo/azki-song-db/commit/494db07893137a9930ce8d51a15c697ee210d3f1))
* 一つの動画で同じ曲を歌唱した場合にハイライトがおかしくなるのを修正 ([b41b440](https://github.com/mitsugogo/azki-song-db/commit/b41b440cecc2aa01dffd84fb3c90ca1336961172))
* 不要なshadowを削除 ([c74f28b](https://github.com/mitsugogo/azki-song-db/commit/c74f28b38742767d3a37a4ba199e3385f11b99dd))
* 不要なリロード処理を削除(statsページから戻れなかった) ([4aa3596](https://github.com/mitsugogo/azki-song-db/commit/4aa3596a6fc9e252e356e47a09dd4b49111c1efd))
* 先頭/最終ボタン追加 ([7bea741](https://github.com/mitsugogo/azki-song-db/commit/7bea741853164b4e3b5ef20d8d1efada9fe4bb2f))
* 曲スイッチャーが変わらないバグを修正 ([30dc3a4](https://github.com/mitsugogo/azki-song-db/commit/30dc3a45bf18d77759121639463d81514555079d))
* 曲リストタイルのローディングspinnerを上下中央に ([56ae32b](https://github.com/mitsugogo/azki-song-db/commit/56ae32b44c5e17a8e2f444d52bb5e94ee6a109c8))
* 検索フォームのレンダリングコスト改善 ([bbd19a9](https://github.com/mitsugogo/azki-song-db/commit/bbd19a9b37ff7220d763ff33b66ce294d87af721))
* 画像は最適化しない ([6665197](https://github.com/mitsugogo/azki-song-db/commit/6665197dbbafe98c42c4e474a88d16b2fff1b9b6))
* 細かいレイアウト崩れ修正 ([e4ad225](https://github.com/mitsugogo/azki-song-db/commit/e4ad22503f00b63a70f25fdf00a96e50a44cb0ca))
* 統計情報のローディング時の崩れ修正 ([5368607](https://github.com/mitsugogo/azki-song-db/commit/5368607d414578f4a7475faecbc0c857cc8bb76d))
* 統計情報の崩れ修正 ([e089df1](https://github.com/mitsugogo/azki-song-db/commit/e089df15a5394a7bdff62499a4486343863e7c1e))
* 統計情報の調整 ([2c957f1](https://github.com/mitsugogo/azki-song-db/commit/2c957f19fe8fa73b17dedf655915cdc3e3761496))
* 統計情報ページのスクロールバー調整 ([f17b4b2](https://github.com/mitsugogo/azki-song-db/commit/f17b4b26119234ad446d23084d3481ab75f81b7c))
* 縦スクロールバーが出るのを修正 ([fb2cf47](https://github.com/mitsugogo/azki-song-db/commit/fb2cf475e21a8fd391fb9cac3b4614e08662e516))
* 色調整 ([b8338f6](https://github.com/mitsugogo/azki-song-db/commit/b8338f6a656c05cf9714939ea0d6ff630d64789f))
* 謝辞の文言調整 ([e6bb7fd](https://github.com/mitsugogo/azki-song-db/commit/e6bb7fd039a69351fe15546f1726df3e71e3d8d2))
* 重複イベント修正 ([2f95e76](https://github.com/mitsugogo/azki-song-db/commit/2f95e76c19d296d962b54ef06464c75b22214c13))
* 高解像度でのレイアウト崩れを調整 ([f4c3138](https://github.com/mitsugogo/azki-song-db/commit/f4c31384762568a12512a251eddda22cba48b9ac))

### 0.1.2 (2025-08-23)


### Features

* OGPに検索クエリ反映 ([9b60078](https://github.com/mitsugogo/azki-song-db/commit/9b60078f0e7e4959d9dd4fbcd5c186b5a3099b27))
* OS連動のダークモードボタンを追加 ([0c1bb23](https://github.com/mitsugogo/azki-song-db/commit/0c1bb23a9c4fe727c42a91257a81238f73cc3c56))
* マイルストーンタブを追加 ([d61c470](https://github.com/mitsugogo/azki-song-db/commit/d61c47005a5f5478aaa3889f0bb79809905436a8))
* マイルストーンに対応 ([cf9ff58](https://github.com/mitsugogo/azki-song-db/commit/cf9ff58242ee32a6fd48b4a09e4b84df35929a6f))
* マイルストーンバッジをclickで検索可能に ([6a065d5](https://github.com/mitsugogo/azki-song-db/commit/6a065d558f08c0f392f54afc481d052e4f6028c9))
* モバイル時のレイアウトを見直し ([15d276c](https://github.com/mitsugogo/azki-song-db/commit/15d276c25b384437d9b3e843326363685fcd7e9c))
* 検索のタグ化 ([37532df](https://github.com/mitsugogo/azki-song-db/commit/37532df881dc15f63f9814ffa5c6238de30d6643))
* 現在の歌枠に残る機能 ([f15684a](https://github.com/mitsugogo/azki-song-db/commit/f15684a8bd2a62dac638367c97d462e99ad592fc))
* 高度な検索にマイルストーンを追加 ([e6759b1](https://github.com/mitsugogo/azki-song-db/commit/e6759b17f71895ca8802426d0f1063ca4b1ecf29))
* 高度な検索機能 ([ff8ee2a](https://github.com/mitsugogo/azki-song-db/commit/ff8ee2a108617e7eae7f1dca52e6ac7b1502e69e))
* 統計情報の実装、伴ったレイアウト見直し ([6dacdf2](https://github.com/mitsugogo/azki-song-db/commit/6dacdf2ab4546ad15d199f9dda23e65a1c4677c3))


### Bug Fixes

* 「オリ曲」の歌唱数の算出を調整 ([ea7af17](https://github.com/mitsugogo/azki-song-db/commit/ea7af17cd39aeb3684b8a0b66d669307bac57709))
* 50件→200件 ([194f06b](https://github.com/mitsugogo/azki-song-db/commit/194f06b1e48e7ea997fc0e4300a7526d489b04f1))
* add key ([f907650](https://github.com/mitsugogo/azki-song-db/commit/f907650eeaaa3e1cde6fefdf2b97ed4769823c6c))
* Analytics系をlayoutに配置 ([0289ae7](https://github.com/mitsugogo/azki-song-db/commit/0289ae7af796aaabb46e567a091968bd7e0ce1c7))
* autocompleteエリアの高さ調整 ([fe3e4b0](https://github.com/mitsugogo/azki-song-db/commit/fe3e4b060de56d812a40ae5321cc066ae14c2444))
* Autocomplete改善 ([b21ad4e](https://github.com/mitsugogo/azki-song-db/commit/b21ad4ed51e4c983cb9ad229779e8b9d95b54b98))
* comment ([24a4de0](https://github.com/mitsugogo/azki-song-db/commit/24a4de0aa942215d8f1de4993b2f44e3ef4d6165))
* darkモードでボタン影削除 ([cd8ee50](https://github.com/mitsugogo/azki-song-db/commit/cd8ee50d8923acdf4cea0b37f91156bd94ebd1f2))
* darkモード切り替えボタンのhover調整 ([e0e5c82](https://github.com/mitsugogo/azki-song-db/commit/e0e5c82770c4cbde2e639280e2e483f08a898803))
* deprecated対応 ([ba14ac0](https://github.com/mitsugogo/azki-song-db/commit/ba14ac0311ae4f9e1878e51b86c2eef22b3f7d4b))
* ESlint ([faea2fd](https://github.com/mitsugogo/azki-song-db/commit/faea2fda92296acb054ebfaed4825e8985872494))
* ESlint ([9bb6733](https://github.com/mitsugogo/azki-song-db/commit/9bb6733771856dd284b9615fa25a4fba101d667c))
* ESlint ([a1d01b4](https://github.com/mitsugogo/azki-song-db/commit/a1d01b4c5974b82ece9b1cdc328d657cded5a216))
* ESlint ([1be1fdc](https://github.com/mitsugogo/azki-song-db/commit/1be1fdc42ff5949f15b909ca3a4254a7e0f77972))
* ESlint ([cdc1cb0](https://github.com/mitsugogo/azki-song-db/commit/cdc1cb0a02f7a795a4e6d03b4532e1c03d86d862))
* index位置バグ修正 ([36be834](https://github.com/mitsugogo/azki-song-db/commit/36be834f4062ad1b9eb672c74ef05cf1ac6f99d4))
* iOSでの表示くずれ対応 ([bbe85b9](https://github.com/mitsugogo/azki-song-db/commit/bbe85b9541b68f32061c4e7ad8669f5c2a69804c))
* mdサイズ時の高さ調整 ([e51f787](https://github.com/mitsugogo/azki-song-db/commit/e51f787a5a1743512222209f394e5436bcafe28f))
* md時にレイアウトが厳しくなるのを修正 ([71b543c](https://github.com/mitsugogo/azki-song-db/commit/71b543c0b97ae34d115148563c8d1b1a98dedb19))
* og ([f70d99f](https://github.com/mitsugogo/azki-song-db/commit/f70d99ffae12a0c3fb1eff620fb7f479f265676d))
* OGP処理修正 ([f21c17b](https://github.com/mitsugogo/azki-song-db/commit/f21c17b7902b66e79db4a73046c3f71f63221b96))
* og修正 ([c05bb54](https://github.com/mitsugogo/azki-song-db/commit/c05bb5411866bd99ee4dd8651661a58768ecf677))
* OSのテーマに追従するモード ([347a8a8](https://github.com/mitsugogo/azki-song-db/commit/347a8a810321b99f9bd9158923de87cbea5f6468))
* q=検索ワードのアクセスが喪失するのを修正 ([6207927](https://github.com/mitsugogo/azki-song-db/commit/6207927b43e14d448625dfc0617adaf0f83dbe9f))
* reformat ([c54b8cd](https://github.com/mitsugogo/azki-song-db/commit/c54b8cdc6afd5f28b4be77d91ccd82384e823dc5))
* tabに指定できる文字列の厳格化 ([135d164](https://github.com/mitsugogo/azki-song-db/commit/135d1644c1f4307aeadcdced4a45b1454a618c5a))
* tailwind CSS v4準拠 ([9f52fc7](https://github.com/mitsugogo/azki-song-db/commit/9f52fc775a84ea435ebfa5b4268571668d6dd409))
* timerのクリア処理を調整 ([c5ad3b9](https://github.com/mitsugogo/azki-song-db/commit/c5ad3b9c3cb9b5b4f9d9c68d905d22bd5b81c141))
* tooltipがうまく出ないので削除 ([f777f68](https://github.com/mitsugogo/azki-song-db/commit/f777f687842691d2568f3a1ff3dcfd1fcff828ae))
* URLのタブ番号が保持されないバグを修正 ([f272989](https://github.com/mitsugogo/azki-song-db/commit/f27298926694dfcf8ba714b6f40a4582047c64cc))
* vercelの上限対策 ([8670012](https://github.com/mitsugogo/azki-song-db/commit/8670012be42f0bb267e899466f98b8c5633cfb11))
* workflow ([66b69b8](https://github.com/mitsugogo/azki-song-db/commit/66b69b89b87ccee7cde6cb0041c54f3fff84cfa6))
* workflow権限追加忘れ ([781465a](https://github.com/mitsugogo/azki-song-db/commit/781465ac7a704b8eb9767959a9d505f2e26d5dea))
* workflow置き場所間違えてた... ([1982d2d](https://github.com/mitsugogo/azki-song-db/commit/1982d2d21a28db3125f235366c592741d89eb8fc))
* workflow調整 ([2eec005](https://github.com/mitsugogo/azki-song-db/commit/2eec0053ff82d8489b099c2c290e8e6c0f2ae8c1))
* YouTubeのID仕様によるURL判定調整 ([3f5c95b](https://github.com/mitsugogo/azki-song-db/commit/3f5c95bfe3b2d80d3fb2e0c444305ee85a490582))
* YouTubeのサムネイル画像読み込みエラー判定を調整 ([fb5a555](https://github.com/mitsugogo/azki-song-db/commit/fb5a555fab6cd0301bb3e355b95a35ce945478e8))
* エラーハンドル調整 ([3f3644c](https://github.com/mitsugogo/azki-song-db/commit/3f3644c47c1ef5c8bb3668f76a9401f3f102a980))
* サムネイル表示によるスクロール位置ズレ調整 ([82d5d2e](https://github.com/mitsugogo/azki-song-db/commit/82d5d2efc8ec7b25ac9422a3758d2d5e6f5a3d56))
* スクロール処理調整 ([1b8c1d4](https://github.com/mitsugogo/azki-song-db/commit/1b8c1d45347a5c29f085473a56c2d8df0be93455))
* スマホでは縦領域が厳しいのでフッターを削除 ([f754375](https://github.com/mitsugogo/azki-song-db/commit/f7543759998c658847adfc3b87250eb75c45dabb))
* スマホで上下にスクロールするバグを調整してみた ([335b87f](https://github.com/mitsugogo/azki-song-db/commit/335b87fcf26a3fa104a363076cba5a422f6c4e65))
* スライスするときに何故かページ番号いれてた… ([07f4b2e](https://github.com/mitsugogo/azki-song-db/commit/07f4b2eac5d88d393ad7081732d4c1a13a997167))
* ダークモードで曲詳細のどのbadgeが活性かわからないのを修正 ([9d3abbb](https://github.com/mitsugogo/azki-song-db/commit/9d3abbb72e9528b3ba20fd6787d96e92ce9c2c32))
* ダークモードの背景を1段階暗くした ([060002f](https://github.com/mitsugogo/azki-song-db/commit/060002fcb97e30c3e44ef3b4ee2d2746cf511c67))
* タイムスタンプが1つのみの場合は非表示 ([86487d2](https://github.com/mitsugogo/azki-song-db/commit/86487d2781968d34a3e9280802f3ce93033682c5))
* タイムスタンプを展開式に ([e4fe0b0](https://github.com/mitsugogo/azki-song-db/commit/e4fe0b0f7d1940c43bdb37eee97bea222ad7f237))
* テーマのトグルボタンのエラー修正 ([0451e4b](https://github.com/mitsugogo/azki-song-db/commit/0451e4b6c3d9ab06c0c94dd718d781b597b65c42))
* ページャーバグ修正 ([0c04fe1](https://github.com/mitsugogo/azki-song-db/commit/0c04fe1e816430c62eaebd73a23713adc8cb9c4d))
* ページャーを入れたことでスクロールが出来なくなったのを修正 ([f60d1fb](https://github.com/mitsugogo/azki-song-db/commit/f60d1fb5a610338b464597cbae88188da20199ad))
* ページ番号からのindex計算ミス修正 ([e892690](https://github.com/mitsugogo/azki-song-db/commit/e89269065445170c60b856cd3484268e1feeaa63))
* ボタンの角丸調整 ([36f5fa9](https://github.com/mitsugogo/azki-song-db/commit/36f5fa9d87d9d3a2bcc131cdaeea76770cf312e8))
* マイルストーンバッジ ([b2746e0](https://github.com/mitsugogo/azki-song-db/commit/b2746e069a5be0411fb5d672a880dd8d03e04659))
* モバイルメニュー調整 ([5ff3601](https://github.com/mitsugogo/azki-song-db/commit/5ff36013e5c6e2d251a80a3d2aaa931017aaaaee))
* レイアウト調整 ([494db07](https://github.com/mitsugogo/azki-song-db/commit/494db07893137a9930ce8d51a15c697ee210d3f1))
* レイアウト微調整 ([e0d0e67](https://github.com/mitsugogo/azki-song-db/commit/e0d0e67faba544b04402a7888507bdd5a45a04c7))
* レイアウト微調整 ([e49ec49](https://github.com/mitsugogo/azki-song-db/commit/e49ec496bcb097a8d950947ef45034b5c97a1495))
* レイアウト微調整 ([7a8f113](https://github.com/mitsugogo/azki-song-db/commit/7a8f11363037649c338ec95b8ebc16d45968a995))
* レイアウト微調整 ([ea037f9](https://github.com/mitsugogo/azki-song-db/commit/ea037f94774122845e50af52e4482cc927a113a2))
* 一つの動画で同じ曲を歌唱した場合にハイライトがおかしくなるのを修正 ([b41b440](https://github.com/mitsugogo/azki-song-db/commit/b41b440cecc2aa01dffd84fb3c90ca1336961172))
* 画像は最適化しない ([6665197](https://github.com/mitsugogo/azki-song-db/commit/6665197dbbafe98c42c4e474a88d16b2fff1b9b6))
* 曲スイッチャーが変わらないバグを修正 ([30dc3a4](https://github.com/mitsugogo/azki-song-db/commit/30dc3a45bf18d77759121639463d81514555079d))
* 曲リストタイルのローディングspinnerを上下中央に ([56ae32b](https://github.com/mitsugogo/azki-song-db/commit/56ae32b44c5e17a8e2f444d52bb5e94ee6a109c8))
* 検索フォームのレンダリングコスト改善 ([bbd19a9](https://github.com/mitsugogo/azki-song-db/commit/bbd19a9b37ff7220d763ff33b66ce294d87af721))
* 高解像度でのレイアウト崩れを調整 ([f4c3138](https://github.com/mitsugogo/azki-song-db/commit/f4c31384762568a12512a251eddda22cba48b9ac))
* 細かいレイアウト崩れ修正 ([e4ad225](https://github.com/mitsugogo/azki-song-db/commit/e4ad22503f00b63a70f25fdf00a96e50a44cb0ca))
* 謝辞の文言調整 ([e6bb7fd](https://github.com/mitsugogo/azki-song-db/commit/e6bb7fd039a69351fe15546f1726df3e71e3d8d2))
* 縦スクロールバーが出るのを修正 ([fb2cf47](https://github.com/mitsugogo/azki-song-db/commit/fb2cf475e21a8fd391fb9cac3b4614e08662e516))
* 重複イベント修正 ([2f95e76](https://github.com/mitsugogo/azki-song-db/commit/2f95e76c19d296d962b54ef06464c75b22214c13))
* 色調整 ([b8338f6](https://github.com/mitsugogo/azki-song-db/commit/b8338f6a656c05cf9714939ea0d6ff630d64789f))
* 先頭/最終ボタン追加 ([7bea741](https://github.com/mitsugogo/azki-song-db/commit/7bea741853164b4e3b5ef20d8d1efada9fe4bb2f))
* 統計情報のローディング時の崩れ修正 ([5368607](https://github.com/mitsugogo/azki-song-db/commit/5368607d414578f4a7475faecbc0c857cc8bb76d))
* 統計情報の調整 ([2c957f1](https://github.com/mitsugogo/azki-song-db/commit/2c957f19fe8fa73b17dedf655915cdc3e3761496))
* 統計情報の崩れ修正 ([e089df1](https://github.com/mitsugogo/azki-song-db/commit/e089df15a5394a7bdff62499a4486343863e7c1e))
* 統計情報ページのスクロールバー調整 ([f17b4b2](https://github.com/mitsugogo/azki-song-db/commit/f17b4b26119234ad446d23084d3481ab75f81b7c))
* 不要なshadowを削除 ([c74f28b](https://github.com/mitsugogo/azki-song-db/commit/c74f28b38742767d3a37a4ba199e3385f11b99dd))
* 不要なリロード処理を削除(statsページから戻れなかった) ([4aa3596](https://github.com/mitsugogo/azki-song-db/commit/4aa3596a6fc9e252e356e47a09dd4b49111c1efd))
