import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join, basename } from "path";
import HumanJSON from "../src/index.js";

/**
 * Get all fixture JSON files
 * @returns {string[]} Array of fixture file basenames (without extension)
 */
function getFixtureFiles() {
  const fixturesDir = join(import.meta.dir, "../examples");
  const files = readdirSync(fixturesDir);
  return files
    .filter((file) => file.endsWith(".json") && !file.endsWith("~human.json"))
    .map((file) => basename(file, ".json"))
    .sort();
}

describe.concurrent("Fixture tests - comparing with expected output", () => {
  const fixtures = getFixtureFiles();

  for (const filename of fixtures) {
    test(`formats ${filename} correctly`, () => {
      const fixturesDir = join(import.meta.dir, "../examples");

      // Read input JSON
      const inputPath = join(fixturesDir, `${filename}.json`);
      const inputContent = readFileSync(inputPath, "utf-8");
      const inputData = JSON.parse(inputContent);

      // Read expected output
      const expectedPath = join(fixturesDir, `${filename.replace(/__.*$/, "")}~human.json`);
      const expectedContent = readFileSync(expectedPath, "utf-8");

      const priorityKeys = filename
        .match(/keys=([^;]+)/)?.[1]
        ?.split(",")
        ?.map((k) => k.trim());
      const lineLength = parseInt(filename.match(/line_length=(\d+)/)?.[1] || 120, 10);
      const options = {};
      if (priorityKeys) options.sortPriorityKeys = priorityKeys;

      // Format with HumanJSON using default settings (max line length 80 for fixtures)
      const result = HumanJSON.stringify(inputData, 2, lineLength, options);

      // Compare - if this fails, the expected files may need to be regenerated
      // Run: npm run update-fixtures
      expect(result).toBe(expectedContent);
    });
  }
});
