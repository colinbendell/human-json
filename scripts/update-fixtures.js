#!/usr/bin/env node

/**
 * Script to regenerate expected fixture outputs
 * Run with: node scripts/update-fixtures.js
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";
import HumanJSON from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputDir = join(__dirname, "../examples");

// Get all fixture files
const files = readdirSync(inputDir);
const fixtureFiles = files.filter((file) => file.endsWith(".json") && !file.endsWith("~human.json")).sort();

console.log(`Updating ${fixtureFiles.length} examples...\n`);

for (const file of fixtureFiles) {
  const filename = basename(file, ".json");
  const inputPath = join(inputDir, file);

  // Extract parameters using regex
  const priorityKeys = filename.match(/keys=([^;]+)/)?.[1]?.split(",")?.map((k) => k.trim());
  if (priorityKeys) {
    console.log(`Priority keys: ${priorityKeys.join(", ")}`);
  }

  const lineLength = parseInt(filename.match(/line_length=(\d+)/)?.[1] || 120, 10);

  // Extract base name (everything before __)
  const baseName = filename.split("__")[0];
  const outputPath = join(inputDir, `${baseName}~human.json`);

  try {
    // Read and parse input
    const inputContent = readFileSync(inputPath, "utf-8");
    const inputData = JSON.parse(inputContent);
    const options = {}
    if (priorityKeys) options.sortPriorityKeys = priorityKeys;

    const formattedOutput = HumanJSON.stringify(inputData, 2, lineLength, options);

    // Write expected output
    writeFileSync(outputPath, formattedOutput, "utf-8");

    console.log(`✓ Updated ${baseName}~human.json`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Failed to update ${baseName}: ${message}`);
  }
}

console.log("\n✓ All fixtures updated!");
