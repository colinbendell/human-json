#!/usr/bin/env node

/**
 * Build script for human-json
 * Copies source files to dist and ensures CLI has executable permissions
 */

import { copyFileSync, mkdirSync, chmodSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, "src");
const distDir = join(__dirname, "dist");

console.log("Building human-json...");

// Ensure dist directory exists
try {
  mkdirSync(distDir, { recursive: true });
} catch (error) {
  console.error("Failed to create dist directory:", error);
  process.exit(1);
}

// Copy files
const filesToCopy = ["index.js", "cli.js"];

for (const file of filesToCopy) {
  try {
    const src = join(srcDir, file);
    const dest = join(distDir, file);
    copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);

    // Make CLI executable
    if (file === "cli.js") {
      chmodSync(dest, 0o755);
      console.log(`✓ Made ${file} executable`);
    }
  } catch (error) {
    console.error(`Failed to copy ${file}:`, error);
    process.exit(1);
  }
}

console.log("✓ Build complete!");
