import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join, basename } from "path";
import HumanJSON from "../src/index.js";

/**
 * Get all fixture JSON files
 * @returns {string[]} Array of fixture file basenames (without extension)
 */
function getFixtureFiles() {
  const fixturesDir = join(import.meta.dir, "fixtures");
  const files = readdirSync(fixturesDir);
  return files
    .filter((file) => file.endsWith(".json") && !file.endsWith(".human.json"))
    .map((file) => basename(file, ".json"))
    .sort();
}

describe("Fixture tests - comparing with expected output", () => {
  const fixtures = getFixtureFiles();

  for (const fixtureName of fixtures) {
    test(`formats ${fixtureName} correctly`, () => {
      const fixturesDir = join(import.meta.dir, "fixtures");
      const expectsDir = join(fixturesDir, "expects");

      // Read input JSON
      const inputPath = join(fixturesDir, `${fixtureName}.json`);
      const inputContent = readFileSync(inputPath, "utf-8");
      const inputData = JSON.parse(inputContent);

      // Read expected output
      const expectedPath = join(expectsDir, `${fixtureName}.human.json`);
      const expectedContent = readFileSync(expectedPath, "utf-8");

      // Format with HumanJSON using default settings (max line length 80 for fixtures)
      const result = HumanJSON.stringify(inputData, 2, 120);

      // Compare - if this fails, the expected files may need to be regenerated
      // Run: npm run update-fixtures
      expect(result).toBe(expectedContent);
    });
  }
});
