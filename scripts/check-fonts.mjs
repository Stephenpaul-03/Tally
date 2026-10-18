import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFonts = [
  "Switzer-Regular.ttf",
  "Switzer-Medium.ttf",
  "Switzer-Semibold.ttf",
  "Switzer-Bold.ttf",
];

export function assertFontsInstalled(projectRoot = root) {
  const missing = requiredFonts.filter(name => {
    try {
      const file = statSync(path.join(projectRoot, "assets/fonts", name));
      return !file.isFile() || file.size === 0;
    } catch (error) {
      if (error.code === "ENOENT") return true;
      throw error;
    }
  });
  if (missing.length) {
    throw new Error([
      "Switzer must be installed locally before running or building Tally.",
      "Download it from https://www.fontshare.com/fonts/switzer and copy these files into assets/fonts/:",
      ...missing.map(name => `  - ${name}`),
      "See assets/fonts/README.md for setup and licensing details.",
    ].join("\n"));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assertFontsInstalled();
    console.log("Required local Switzer fonts are installed.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
