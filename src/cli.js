#!/usr/bin/env node

/**
 * CLI for HumanJSON - A human-readable JSON formatter
 *
 * Usage:
 *   human-json <input-file> [options]
 *   cat file.json | human-json [options]
 *
 * Options:
 *   --keys <keys>    Comma-separated list of keys to prioritize (e.g., "name,version,date")
 *   --indent <spaces>    Number of spaces for indentation (default: 2)
 *   --max-length <num>   Maximum line length before wrapping (default: 120)
 *   --help, -h           Show this help message
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { HumanJSON } from "./index.js";

/**
 * Prints usage information
 */
function printHelp() {
  console.log(`
HumanJSON CLI - Human-readable JSON formatter

USAGE:
  human-json <input-file> [options]
  cat file.json | human-json [options]

OPTIONS:
  --keys <keys>    Comma-separated list of keys to prioritize at the top
                       Example: --priority name,version,date

  --indent <spaces>    Number of spaces for indentation (default: 2)

  --max-length <num>   Maximum line length before wrapping (default: 120)

  --help, -h           Show this help message

EXAMPLES:
  # Format a JSON file with default settings
  human-json package.json

  # Prioritize specific keys at the top
  human-json package.json --keys name,version,description

  # Use 4 spaces for indentation
  human-json data.json --indent 4

  # Pipe from stdin
  cat data.json | human-json --keys id,name

  # Disable key sorting
  human-json data.json --no-sort
`);
}

/**
 * Parses command line arguments
 * @returns {{inputFile: string | null, indentSpaces: number, maxLineLength: number, options: object}}
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  /** @type {string | null} */
  let inputFile = null;
  let indentSpaces = 2;
  let maxLineLength = 120;
  /** @type {string[] | undefined} */
  let sortPriorityKeys = undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--keys") {
      const nextArg = args[++i];
      if (!nextArg) {
        console.error("Error: --keys requires a comma-separated list of keys");
        process.exit(1);
      }
      sortPriorityKeys = nextArg.split(",").map((k) => k.trim());
    } else if (arg === "--indent") {
      const nextArg = args[++i];
      if (!nextArg) {
        console.error("Error: --indent requires a number");
        process.exit(1);
      }
      indentSpaces = parseInt(nextArg, 10);
      if (isNaN(indentSpaces) || indentSpaces < 0) {
        console.error("Error: --indent must be a non-negative number");
        process.exit(1);
      }
    } else if (arg === "--max-length") {
      const nextArg = args[++i];
      if (!nextArg) {
        console.error("Error: --max-length requires a number");
        process.exit(1);
      }
      maxLineLength = parseInt(nextArg, 10);
      if (isNaN(maxLineLength) || maxLineLength <= 0) {
        console.error("Error: --max-length must be a positive number");
        printHelp();
        process.exit(1);
      }
    } else if (!arg.startsWith("--")) {
      if (inputFile === null) {
        inputFile = arg;
      } else {
        console.error(`Error: Unexpected argument "${arg}"`);
        printHelp();

        process.exit(1);
      }
    } else {
      console.error(`Error: Unknown option "${arg}"`);
      printHelp();
      process.exit(1);
    }
  }

  /** @type {import('./index.js').HumanJSONOptions} */
  const options = {};

  if (sortPriorityKeys !== undefined) {
    options.sortPriorityKeys = sortPriorityKeys;
  }

  return {
    inputFile,
    indentSpaces,
    maxLineLength,
    options,
  };
}

/**
 * Reads input from file or stdin
 * @param {string | null} inputFile - Path to input file, or null for stdin
 * @returns {string} The input content
 */
function readInput(inputFile) {
  if (inputFile) {
    try {
      const filePath = resolve(inputFile);
      return readFileSync(filePath, "utf-8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error reading file "${inputFile}":`, message);
      process.exit(1);
    }
  } else {
    // Read from stdin
    try {
      return readFileSync(0, "utf-8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error reading from stdin:", message);
      process.exit(1);
    }
  }
}

/**
 * Main CLI function
 */
function main() {
  const { inputFile, indentSpaces, maxLineLength, options } = parseArgs();

  // Read input
  const input = readInput(inputFile);

  // Parse JSON
  /** @type {any} */
  let data;
  try {
    data = JSON.parse(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error parsing JSON:", message);
    process.exit(1);
  }

  // Format with HumanJSON
  try {
    const output = HumanJSON.stringify(data, indentSpaces, maxLineLength, options);
    process.stdout.write(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error formatting JSON:", message);
    process.exit(1);
  }
}

// Run the CLI
main();
