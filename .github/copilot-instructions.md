# Copilot Instructions

Personal portfolio and side-project site for Caleb Sanchez, hosted on GitHub Pages at the root of `calebcsanchez.github.io`. It is a static site with no build step, no bundler and no framework. Keep it that way unless asked.

## Structure

Organize by feature, not by file type. Everything a feature needs lives in its own folder.

```
index.html              Portfolio home page
assets/                 Portfolio-only and shared files
  css/ js/ images/ documents/
projects/               Small fun projects ("the lab")
  index.html            Hub page that links to every side project
  <name>/               One folder per project: index.html + its own css/js/audio
halloween/              Seasonal event: chooser page plus bingo/ and rankchoice/
tests/                  Mirrors the source tree (tests/halloween/...)
archive/                Retired files kept for reference; never load from here
firestore.rules         Firebase security rules (source of truth, published manually)
```

- A new side project goes in `projects/<name>/` and must be added to `projects/index.html`.
- Pages use `index.html` inside a folder so URLs are clean (`/halloween/bingo/`).
- Do not add files to the repo root.
- `assets/documents/*.pdf` is gitignored on purpose (personal documents).

## Conventions

- Use root-absolute paths for local files (`/assets/images/favicon.png`), because the site is served from the domain root.
- Vanilla HTML, CSS and JavaScript only. Use ES modules (`type="module"`) for new scripts that import each other. Older portfolio scripts are classic scripts that share globals; leave them as they are.
- Keep pure logic (calculation, tallying) in its own file with no DOM access so it can be unit tested. Examples are `halloween/bingo/bingo-core.js` and `halloween/rankchoice/tally.js`.
- Build DOM with `textContent` and `createElement`. Never put user-entered text into `innerHTML`.
- Match existing style: 2-space indent in new Halloween and project files, single quotes, semicolons.
- Keep comments to one short line and only for things the code cannot show. No change-log comments.
- Do not add dependencies, frameworks or analytics without asking. Small CDN libraries are acceptable when they save real work (SortableJS, jsPDF, Firebase SDK).
- Do not create extra markdown files to document changes.

## Halloween theme

Dark background, orange (`--orange`, `--orange-bright`) and violet accents, the Creepster display font and DM Sans body font. All Halloween pages share `halloween/halloween.css`; bingo adds `halloween/bingo/bingo.css`. User-facing copy should be playfully spooky (for example "The voting has not been set up yet!"), while still being clear.

## Ranked-choice voting (`halloween/rankchoice/`)

- Backend is Firebase Firestore, called directly from the browser. There is no server.
- Guests never sign in. They vote anonymously, and only while `rankchoice/config.status == 'open'`.
- The host signs in with Google. Only the email in `firebase-config.js` (`ADMIN_EMAIL`) and `firestore.rules` may start, reset, edit contestants, remove ballots or close voting.
- The ballot document ID is the lowercased name, which makes duplicates impossible.
- Firebase web config values are public identifiers and are fine to commit. Real protection is `firestore.rules`. Never commit service-account keys or admin credentials.
- If you change the data shape, update `firestore.rules` in the same change and tell the user to republish it in the Firebase console.
- Tally is instant-runoff. Each place (1st, 2nd, 3rd) is a separate run with prior winners removed.

## Testing and verification

- Run unit tests with `node tests/halloween/bingo-core.test.js` (Node's built-in `node:test`). Do not use `node --test tests/`.
- Test pages through a local web server, not `file://`, because module scripts and absolute paths need HTTP.
- Add or update a test whenever you change pure logic.

## Working with the owner

- Caleb prefers simple, readable, well-organized code over clever abstractions. Do not over-engineer.
- Discuss options and trade-offs before building anything involving hosting, data storage or security.
- Many small fun projects here are throwaways, so do not spend effort refactoring them beyond the requested change.
- Windows with PowerShell is the dev environment. Chain commands with `;`, not `&&`.
- Use `git mv` for moves so history is kept. Only commit or push when asked, with a descriptive message that lists what changed and why.
- Ask before deleting files.
