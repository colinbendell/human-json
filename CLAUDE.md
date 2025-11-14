# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

human-json is a smart JSON stringifier that creates human-readable output with configurable formatting, key sorting, and dense wrapping. It provides both a JavaScript API and a CLI tool.

## Development Commands

### Building

```bash
npm run build
```

Runs [build.js](build.js) which copies source files from [src/](src/) to [dist/](dist/) and makes the CLI executable.

### Testing

```bash
npm test           # Run all tests with Bun
npm run test:watch # Run tests in watch mode
```

Tests are located in [tests/index.test.js](tests/index.test.js) and use Bun's test runner.

### Linting and Formatting

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Run ESLint with auto-fix
npm run format        # Format code with Prettier
npm run format:check  # Check formatting without modifying
npm run type-check    # Run TypeScript type checking (no emit)
```

The project uses ESLint with the recommended config (defined in eslint.config.js using flat config format).

## Architecture

### Core Components

**[src/index.js](src/index.js)** - Main formatting engine

- `HumanJSON` class: Main formatter with configurable options
  - Constructor accepts `indentSpaces`, `maxLineLength`, and options object
  - `stringify()` method: Converts JS values to formatted JSON strings
  - `#stringify()` private method: Recursive formatting logic that handles objects, arrays, and primitives
  - `#denseWrap()`: Intelligently combines multiple simple values on single lines
  - `#pad()`: Adds spacing around JSON tokens for readability
  - `#containsOnlySimpleValues()`: Checks if array has only primitives (enables dense wrapping)
- `PriorityKeySorter` class: Sorts object keys alphabetically while keeping priority keys (like "name", "version") at the top

**[src/cli.js](src/cli.js)** - Command-line interface

- Executable script with shebang for direct invocation
- Supports file input and stdin
- CLI arguments: `--priority`, `--indent`, `--max-length`, `--no-sort`, `--no-padding`, `--no-dense`, `--no-newline`

### Key Formatting Features

1. **Dense Wrapping**: When enabled (default), arrays/objects with only simple values (strings, numbers, booleans, null) are wrapped densely to fit multiple items per line within the max line length
2. **Key Sorting**: Object keys are sorted alphabetically, with priority keys appearing first
3. **Smart Line Breaking**: The formatter tries inline formatting first, then falls back to multi-line if it exceeds max line length
4. **Type Handling**: Supports `.toJSON()` methods, Map, Set, ArrayBuffer, and converts undefined to null in arrays (omits in objects)

### Configuration

The project uses JSDoc for type annotations rather than TypeScript compilation:

- [tsconfig.json](tsconfig.json): Configured for type checking only (`noEmit: true`) with strict mode enabled
- `allowJs` and `checkJs` are enabled to type-check JavaScript files
- Source files use JSDoc `@typedef`, `@param`, `@returns` annotations

### Build Process

The custom [build.js](build.js) script:

1. Creates the [dist/](dist/) directory
2. Copies [src/index.js](src/index.js) and [src/cli.js](src/cli.js) to dist/
3. Makes [dist/cli.js](dist/cli.js) executable with chmod 0o755

This is a simple copy-based build since the source is already ES modules.

## Testing

Tests use Bun's test runner with concurrent execution (`describe.concurrent`). Test structure:

- Basic types tests: Primitives, dates, empty objects/arrays
- Array tests: Dense wrapping behavior, mixed types
- Object tests: Key sorting, priority keys, nested structures
- Fixture tests: Real-world examples in [tests/fixtures/](tests/fixtures/)

When adding tests, maintain the pattern of input/expected pairs and use `describe.concurrent` for parallelization.

## Code Style

- ES2022 module syntax (`import`/`export`)
- 2-space indentation
- Private class fields use `#` prefix
- JSDoc annotations for all public APIs
- ESLint rule: unused vars with `_` prefix are ignored
