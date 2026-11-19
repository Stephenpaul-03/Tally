# Electron development

Install dependencies with `npm install`, then run:

```sh
npm run electron
```

This starts Expo web on http://localhost:8090, waits for it to become ready, and opens Tally in Electron using the tablet UI. Closing Electron or pressing Ctrl+C stops both processes. `npm run electron:dev` is an alias for the same launcher.

If port 8090 is occupied, stop that server or choose another port in PowerShell:

```powershell
$env:TALLY_PORT = "8091"
npm run electron
```

Set `TALLY_DEVTOOLS=1` to open DevTools automatically. `electron:open` only opens the desktop window and expects an existing Expo web server.

The prototype keeps its SQLite database in Electron's user-data directory. Android and iOS continue using Expo SQLite; the renderer accesses the desktop database through the preload bridge. This branch includes the tablet layouts from main.
