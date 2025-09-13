# AZKi Song Database

This is a [Next.js](https://nextjs.org) project that is used to generate a song database for AZKi, a virtual YouTuber.

[AZKi Song Database](https://azki-song-db.vercel.app/)

## Features

- Song database with YouTube video links and song information (title, artist, album, etc.)
- Song search function
- Song list with pagination and filter by song type (e.g. original song, cover song, etc.)
- Song detail page with YouTube video player and song information
- Responsive design for mobile and desktop devices
- Analytics for tracking page views and user behavior
- Dark mode

## Development Note

[AZKi Song Database Development Note](https://note.com/n_mitsugogo/n/nbdd8a359e307) (JP)

## Data management

The data is managed using Google Spread Sheets. The table structure is as follows:

| #   | Enabled | Song Title   | Artist | Vocalist | Video       | start   | end | Release Date | tags (comma-separated) | Notes        | Milestone |
| --- | ------- | ------------ | ------ | -------- | ----------- | ------- | --- | ------------ | ---------------------- | ------------ | --------- |
| 1   | TRUE    | Sample Music | Artist | Singer   | Video title | 0:00:00 |     | 2025/08/01   | tagA,tagB              | Any notes... | Debut MV  |

- Video title should include a link to YouTube video using Google Sheets' hyperlink function (e.g. =HYPERLINK("https://www.youtube.com/watch?v=aA1WjJfRQ3Q", "Video title"))

## Development

The development environment is set up using the following steps:

1. Clone the repository using `git clone`
2. Install the dependencies using `npm install`
3. Start the development server using `npm run dev`
4. Open the web page at `http://localhost:3000`

## Environment variables

The following environment variables are used in the project:

| Variable name          | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `GOOGLE_API_KEY`       | Google Sheets API key for reading data from Google Sheets  |
| `SPREADSHEET_ID`       | Google Sheets ID for reading data from Google Sheets       |
| `YOUTUBE_DATA_API_KEY` | YouTube Data API key for reading YouTube video information |
| `PUBLIC_BASE_URL`      | Base URL for the production environment                    |

Please set these environment variables in your `.env.local` file or in your production environment.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
