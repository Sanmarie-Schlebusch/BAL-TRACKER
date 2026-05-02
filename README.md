# BAL Inventory Tracker

This repository contains the `artifacts/bal-inventory` Vite app.

## GitHub Pages deployment

A GitHub Actions workflow has been added at `.github/workflows/gh-pages.yml`.
It builds `artifacts/bal-inventory` and publishes the production output from `artifacts/bal-inventory/dist/public` to the `gh-pages` branch.

### How to deploy

1. Commit your changes:

```bash
cd /Users/Sannas/Desktop/Github/Stock-Master
git add .
git commit -m "Add GitHub Pages deployment"
```

2. Push to your repository:

```bash
git push origin main
```

> If your default branch is `master`, use `git push origin master` instead.

3. GitHub Actions will run automatically and publish the site to `gh-pages`.

### Local build verification

To test the build locally before pushing:

```bash
cd /Users/Sannas/Desktop/Github/Stock-Master/artifacts/bal-inventory
pnpm run deploy
```

### GitHub Pages site settings

In your GitHub repository settings:
- Go to **Pages**
- Set the source branch to `gh-pages`
- Set the folder to `/` (root)

Once the workflow completes, your site should be available from the GitHub Pages URL shown in the repository settings.
# BAL-TRACKER
