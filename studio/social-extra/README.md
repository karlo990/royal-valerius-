# Extra social posts

One-off posts made outside the Flyer Studio, using the studio's own `css/posts.css` "Playlist" design.
Open an `.html` file in a browser from this folder (it loads `../css/posts.css` and the crest from `../assets`).
For the two Open Day posts, add `?tall` to the URL for the portrait 1080 × 1350 version; without it they show the square 1080 × 1080 version.

| File | Post |
|---|---|
| `playlist-square.html` / `post-playlist-square.png` | "A week at Royal Crest", square version of the studio's portrait Playlist post |
| `open-day-timetable.html` / `post-open-day-playlist-*.png` | "Open Day at Royal Crest", ten classes with times (sample times; confirm before posting) |
| `open-day-practicals.html` / `post-open-day-practicals-*.png` | "Hands-on at Royal Crest", ten practicals with departments instead of times |

The Open Day date isn't set anywhere yet; add it to the caption when it is fixed.
| `fees-receipt-square.html` / `post-fees-receipt-square.png` | "What US$850 a term really buys", square version of the studio's portrait Fees receipt post |
| `backdrop/step-and-repeat.html` / `backdrop/royal-crest-backdrop-3x2.4m.{pdf,png}` | Step-and-repeat media backdrop, 3 m × 2.4 m (PDF has vector text; PNG is 9000×7200) |
| `backdrop/facebook-cover.html` / `backdrop/royal-crest-facebook-cover.png` | Facebook Page cover, 1640×924; key content inside the desktop safe band (open with `?guides` to see it) |
| `rainfall-types.html` / `royal-crest-rainfall-types.{pdf,png}` + `_whatsapp.jpg` | "Three ways the sky makes rain": A4 flyer on convectional, relief and frontal rain (PNG is 300 dpi; render with `node ../video-geo/tools/flyer_shot.mjs rainfall-types.html royal-crest-rainfall-types`) |
| `rainfall-square.html` / `royal-crest-make-it-rain.png` (2160²) + `_1080.jpg` | "3 ways to make it rain": square post, one panorama of convectional, relief and frontal rain (`node ../video-geo/tools/flyer_shot.mjs rainfall-square.html royal-crest-make-it-rain nopdf`) |
