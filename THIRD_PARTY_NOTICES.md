# Third-party notices

The [GNU General Public License v3.0 only](LICENSE) (`GPL-3.0-only`) covers Tally's original code. Copyright © 2026 Stephen Paul; see [NOTICE](NOTICE). Third-party assets and dependencies retain their original licenses; Tally's GPL license does not relicense those files or grant additional rights to them.

## Fonts

- **Bebas Neue** — The Bebas Neue Project Authors / Dharma Type. Licensed under the SIL Open Font License 1.1. [Upstream project](https://github.com/dharmatype/Bebas-Neue) · [License](assets/fonts/BebasNeue-OFL.txt).
- **Switzer** — Indian Type Foundry. Copyright 2015–2021 Indian Type Foundry. All rights reserved. Used for Tally's body text, labels, titles, and amounts under the [ITF Free Font License](https://www.fontshare.com/licenses), separately from Tally's GPLv3 license. Raw font files are excluded from the repository; contributors obtain their own copies directly from [Fontshare](https://www.fontshare.com/fonts/switzer). Follow the [font setup guide](assets/fonts/README.md) before building.

Font names and their trademarks belong to their respective owners.

## Currency data

`data/currencies.json` is copied from `@youssefprodev/rn-currency-picker` by YoussefProDev, copyright 2024. Its [MIT license](data/currencies.LICENSE) is retained with the data. Tally uses its own picker UI.

## Dependencies and icons

JavaScript and native dependencies are listed in `package.json` and locked in `package-lock.json`. Their licenses and copyright notices remain in their upstream packages. Icons are provided through `@expo/vector-icons`; refer to the included icon families' upstream licenses when reusing them independently.
