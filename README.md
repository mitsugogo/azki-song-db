# AZKi Song Database

> [!NOTE]  
> 日本語のREADME -> [README_ja.md](./README_ja.md)


This is a [Next.js](https://nextjs.org) project that is used to generate a song database for AZKi, a virtual YouTuber.

[AZKi Song Database](https://azki-song-db.vercel.app/)

## Features

- Song database with YouTube video links and rich song metadata (title, artist, album, release date, tags, start/end timestamps)
- Data sourced from Google Sheets via the Google Sheets API (requires `GOOGLE_API_KEY` and `SPREADSHEET_ID`)
- YouTube metadata integration and embedded YouTube player with start/end time support
- Instant search overlay with filters (title, artist, tags, song type) and stable locators
- Song list with pagination and filtering; pages generated with Next.js data fetching
- Song detail page showing metadata, lyrics/notes and the embedded player
- Player controls (play/pause/seek, mute persistence) and iframe communication
- Responsive design for mobile and desktop, plus Dark Mode support


## Development Note

[AZKi Song Database Development Note](https://note.com/n_mitsugogo/n/nbdd8a359e307) (JP)

## Data management

The data is managed using Google Spread Sheets. The table structure is as follows:

| #   | Enabled | Song Title   | Artist | Vocalist | Video       | start   | end | Release Date | tags (comma-separated) | Notes        | Milestone |
| --- | ------- | ------------ | ------ | -------- | ----------- | ------- | --- | ------------ | ---------------------- | ------------ | --------- |
| 1   | TRUE    | Sample Music | Artist | Singer   | Video title | 0:00:00 |     | 2025/08/01   | tagA,tagB              | Any notes... | Debut MV  |

- Video title should include a link to YouTube video using Google Sheets' hyperlink function (e.g. =HYPERLINK("https://www.youtube.com/watch?v=aA1WjJfRQ3Q", "Video title"))
- For the header row of the spreadsheet, please refer to the code in `api/songs`

### Sample Sheet

Please copy the sample sheet and use it as a reference for your own sheet. The sample sheet includes the data structure and some sample data.

https://docs.google.com/spreadsheets/d/1ktXlGFx0xZaCjUxuSRaM6SqIX4_mz8Cm8GpzwqSasY8/edit?usp=sharing

## Development

The development environment is set up using the following steps:

1. Clone the repository using `git clone`
2. Install the dependencies using `npm install`
3. Start the development server using `npm run dev`
4. Open the web page at `http://localhost:3000`

## Testing

This project includes comprehensive test suites using Vitest and Playwright.

### Unit Tests (Vitest)

Unit tests are written for React hooks and components using Vitest and React Testing Library.

**Run all unit tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

**Run tests with coverage:**
```bash
npm run test:coverage
```

**Test files location:**
- Hook tests: `src/app/hook/__tests__/*.test.tsx`
- Component tests: `src/app/components/__tests__/*.test.tsx`

### End-to-End Tests (Playwright)

E2E tests are written using Playwright to test the application from a user's perspective.

**Run all E2E tests:**
```bash
npm run test:e2e
```

**Run E2E tests in UI mode:**
```bash
npm run test:e2e:ui
```

**Run E2E tests in headed mode:**
```bash
npm run test:e2e:headed
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
| `PUBLIC_BASE_URL`      | Base URL for the production environment                    |

Please set these environment variables in your `.env.local` file or in your production environment.

## Vercel CDN Cache operation (tag-based purge)

Major data APIs in this project return the `Vercel-Cache-Tag` response header.

- `/api/songs`: `dataset:core,songs,songs:list`
- `/api/milestones`: `dataset:core,milestones,milestones:list`
- `/api/yt/channels`: `dataset:core,channels,channels:list`
- `/api/yt/info`: `yt:info,yt:video`
- `/api/yt/video/[video_id]`: `yt:video,yt:video:{video_id}`
- `/api/stat/views`: `stat:views,stat:views:list`
- `/api/stat/views/[video_id]`: `stat:views,stat:views:single`

### Manual tag purge steps

1. Open your Vercel project `Settings`
2. Open `Caches`
3. Click `Purge CDN Cache` in the `CDN Cache` section
4. Select `Cache Tag`
5. Enter a tag (for example: `songs`) and purge

### Recommended strategy

- Use `Invalidate` for normal operation (recommended)
- Use `Delete` only for urgent recovery scenarios (to avoid slower first-hit and cache stampede risk)
- Keep TTL + `stale-while-revalidate` as default behavior, and use tag `Invalidate` only when immediate freshness is needed
- Use `dataset:core` when you need to refresh multiple core APIs at once

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
