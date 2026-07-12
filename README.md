# AZKi Song Database

[![Test](https://github.com/mitsugogo/azki-song-db/actions/workflows/test.yml/badge.svg)](https://github.com/mitsugogo/azki-song-db/actions/workflows/test.yml)

> [!NOTE]  
> 日本語のREADME -> [README_ja.md](./README_ja.md)


This is a [Next.js](https://nextjs.org) project for AZKi Song Database, an unofficial fan site that collects AZKi's original songs, covers, collaboration songs, singing streams, setlists, activity history, anniversaries, and statistics.

[AZKi Song Database](https://azki-song-db.vercel.app/)

## Features

- Song database with YouTube links, start/end timestamps, credits, albums, tags, milestones, live notes, and call-and-response notes
- Google Sheets-backed data source with localized title/artist maps for Japanese and English pages
- Watch page with embedded YouTube playback, song modes, random playback, favorites, local play counts, and localStorage playlists
- Search page with keyword search, filter categories, exact match, AND/OR search, exclusion search, and advanced search query generation
- Discography pages for originals, unit/guest songs, covers, albums, related streams, and YouTube view statistics
- Activity summaries by year, anniversary countdowns, event cards, recent updates, and milestone/view-count overviews
- Share features including the Cloud Nine song picker and "Where did your AZKi journey begin?" image generator
- PWA support, responsive mobile/desktop UI, light/dark theme switching, QR code sharing, and Open Graph image routes


## Development Note

[AZKi Song Database Development Note](https://note.com/n_mitsugogo/n/nbdd8a359e307) (JP)

## Data Management

The data is managed using Google Sheets and read through the Google Sheets API. The app uses multiple sheets for song data, translation maps, milestones, anniversaries, events, channel metadata, and view statistics.

Core song sheets follow this structure:

| #   | Enabled | Song Title   | Artist | Vocalist | Video       | start   | end | Release Date | tags (comma-separated) | Notes        | Milestone |
| --- | ------- | ------------ | ------ | -------- | ----------- | ------- | --- | ------------ | ---------------------- | ------------ | --------- |
| 1   | TRUE    | Sample Music | Artist | Singer   | Video title | 0:00:00 |     | 2025/08/01   | tagA,tagB              | Any notes... | Debut MV  |

Additional supported columns include `title_en`, `artist_en`, `album`, `album_en`, `album_release_at`, `album_is_compilation`, `lyricist`, `composer`, `arranger`, `live_call`, `live_note`, and `view_count`.

- The `Video` column should include a YouTube link using Google Sheets' hyperlink function, for example `=HYPERLINK("https://www.youtube.com/watch?v=aA1WjJfRQ3Q", "Video title")`
- For the exact accepted header aliases, see `src/app/api/songs/route.tsx`

### Sample Sheet

Please copy the sample sheet and use it as a reference for your own sheet. The sample sheet includes the data structure and some sample data.

https://docs.google.com/spreadsheets/d/1ktXlGFx0xZaCjUxuSRaM6SqIX4_mz8Cm8GpzwqSasY8/edit?usp=sharing

## Requirements

- Node.js: 24.x
- pnpm: 11.x

## Development

1. Clone the repository using `git clone`
2. Install the dependencies using `pnpm install`
3. Copy `.env.example` to `.env.local` and set the required environment variables
4. Start the development server using `pnpm dev`
5. Open the web page at `http://localhost:3000`

## Testing

This project includes Vitest unit/component tests and Playwright end-to-end tests.

### Unit Tests (Vitest)

Unit tests are written for React hooks and components using Vitest and React Testing Library.

**Run all unit tests:**
```bash
pnpm test
```

**Run tests in watch mode:**
```bash
pnpm test:watch
```

**Run tests with coverage:**
```bash
pnpm test:coverage
```

**Test files location:**
- Hook tests: `src/app/hook/__tests__/*.test.tsx`
- Component tests: `src/app/components/__tests__/*.test.tsx`
- API/lib tests: `src/app/**/__tests__/*.test.ts`

### End-to-End Tests (Playwright)

E2E tests are written using Playwright to test the application from a user's perspective.

**Run all E2E tests:**
```bash
pnpm test:e2e
```

**Run E2E tests in UI mode:**
```bash
pnpm test:e2e:ui
```

**Run E2E tests in headed mode:**
```bash
pnpm test:e2e:headed
```

**Test files location:**
- E2E tests: `e2e/*.spec.ts`


## Environment variables

The following environment variables are used in the project:

| Variable name          | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `GOOGLE_API_KEY`       | Google Sheets API key for reading data from Google Sheets |
| `SPREADSHEET_ID`       | Google Sheets ID for reading data from Google Sheets       |
| `YOUTUBE_DATA_API_KEY` | YouTube Data API key for reading YouTube video information |
| `SAVE_SPREADSHEET_ID`  | Google Sheets ID used to save Cloud Nine shared data       |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email used for writing Cloud Nine shared data |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Service account private key used for writing Cloud Nine shared data |
| `NEXT_PUBLIC_BASE_URL` | Public base URL used when generating internal and shared URLs |
| `PUBLIC_BASE_URL`      | Fallback base URL for server-side URL generation           |

Please set these environment variables in your `.env.local` file or in your production environment.

## Vercel CDN Cache operation (tag-based purge)

Major data APIs in this project return the `Vercel-Cache-Tag` response header.

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

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
