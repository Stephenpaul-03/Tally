# App fonts

Tally uses **Switzer** for body text, labels, titles, and amounts through `theme/typography.ts`. **Bebas Neue** supplies the display headings. `App.tsx` loads these fonts before rendering the app.

## Install Switzer before building

Switzer is free to use under the ITF Free Font License, but the raw font files are not redistributed in this repository. Each contributor must obtain their own copy directly from [Fontshare](https://www.fontshare.com/fonts/switzer) and review the [license](https://www.fontshare.com/licenses).

1. Download and extract the Switzer family from Fontshare.
2. Find the static TTF files in the downloaded font package.
3. Copy these four files into this folder, keeping their original names:

   - `Switzer-Regular.ttf`
   - `Switzer-Medium.ttf`
   - `Switzer-Semibold.ttf`
   - `Switzer-Bold.ttf`

4. Run `npm run check:fonts` to confirm the required files are present.

These local files are ignored by Git. Do not add them to commits, pull requests, or source archives. The app's typography is unchanged when they are installed.

Switzer is copyright Indian Type Foundry. Its license is separate from Tally's GPLv3 license.

## Bebas Neue

`BebasNeue-Regular.ttf` remains included under the [SIL Open Font License 1.1](BebasNeue-OFL.txt). See [third-party notices](../../THIRD_PARTY_NOTICES.md) for asset credits.
