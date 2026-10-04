# joetomryan.com

My personal site. Plain HTML, CSS and a little JavaScript. No build step, hosted on Vercel.

- `index.html` holds all the content. Each section (`work`, `projects`, `research`, `life`, `contact`) is an `<article data-view="...">`, opened by its URL hash, e.g. `joetomryan.com/#research`.
- `style.css` has the look. Colours are variables at the top.
- `app.js` handles navigation and the small interactions.

Edit, commit, push to `main`. Vercel redeploys automatically.
