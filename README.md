# AZKi Song Database

This is a [Next.js](https://nextjs.org) project that is used to generate a song database for AZKi, a virtual YouTuber.

[AZKi Song Database](https://azki-song-db.vercel.app/)

## Features

- Song database with YouTube video links and song information (title, artist, album, etc.)
- Song search function
- Song list with pagination and filter by song type (e.g. original song, cover song, etc.)
- Song detail page with YouTube video player and song information
- Responsive design for mobile and desktop devices

## Data management

The data is managed using Google Spread Sheets. The table structure is as follows:

| #   | Enabled | Song Title   | Artist | Vocalist | Video       | start   | end | Release Date | tags (comma-separated) | Notes        | Milestone |
| --- | ------- | ------------ | ------ | -------- | ----------- | ------- | --- | ------------ | ---------------------- | ------------ | --------- |
| 1   | TRUE    | Sample Music | Artist | Singer   | Video title | 0:00:00 |     | 2025/08/01   | tagA,tagB              | Any notes... | Debut MV  |

- Video title should include a link to YouTube video using Google Sheets' hyperlink function (e.g. =HYPERLINK("https://www.youtube.com/watch?v=aA1WjJfRQ3Q", "Video title"))

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
