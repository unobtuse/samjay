# Deployment & Architecture

## Current Structure
- **Project Root**: `/var/www/html/gabemade`
- **Web Root**: `/var/www/html/gabemade/public`
- **React Source**: `/var/www/html/gabemade/public/samjay/react`
- **Build Output**: `/var/www/html/gabemade/public/samjay/react/dist`
- **Assets Source**: `/var/www/html/gabemade/public/samjay/new/assets` (Contains `posters/`, `logos/`, `trailers/`)

## URL Mapping
- **Development URL**: `https://gabemade.it/samjay/live` (Symlink to `react/dist`)
- **Target Production URL**: `https://gabemade.it/samjay`
- **Asset URL Pattern**: `https://gabemade.it/samjay/new/assets/...`

## Deployment Strategy
To go live at `/samjay`:
1. Backup existing `/samjay` folder (the old site).
2. Replace `/samjay` with the contents of `react/dist`.
3. ENSURE the `new/assets` folder remains accessible at `/samjay/new/assets` OR move assets into the React `public` folder before build and update JSON paths to be relative.

## Critical Constraint
The `hero-data.json` currently hardcodes paths like `/samjay/new/assets/...`.
If we move the app to the root of `samjay`, we must ensure `new/assets` is still a valid path or update the JSON.
**Recommended**: Keep `new/assets` where it is as a "CDN" source for now.
