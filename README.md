# human-json

A human-readable JSON formatter. Zero dependencies.

Simply replace: `JSON.stringify(obj)` --> `HumanJSON.stringify(obj)`
Can support legacy drop in: `JSON.stringify(obj, null, 2)` --> `HumanJSON.stringify(obj, null, 2)`

## Example Output

> Notice: alphabetical key sorting, priority keys (like `name`) at the top, line length wrapping, and dense wrapping for arrays

```json
{
  "Comely Comics": [
    {
      "name": "Captain Canuck",
      "alias": "Tom Evans",
      "demographic": { "age": 32, "city": "Ottawa", "gender": "male" },
      "occupation": "RCMP Officer",
      "team": "The Collective",
      "villains": [
        "The Master", "Mr. Gold", "Sasquatch", "The Brain",
        "Madame Rouge", "The Redcoat", "The Black Queen",
        "Dr. Omen", "The Wraith", "General Blitz"
      ]
    }
  ],
  "DC": [
    {
      "name": "Batman",
      "alias": "Bruce Wayne",
      "demographic": { "age": 42, "city": "Gotham", "gender": "male" },
      "occupation": "CEO",
      "team": "Justice League",
      "villains": [
        "The Joker", "The Riddler", "The Penguin", "Two-Face",
        "Catwoman", "Scarecrow", "Poison Ivy", "Bane",
        "Ra's al Ghul", "Mr. Freeze"
      ]
    }
  ]
}
```

## Why?

Standard `JSON.stringify()` creates output that's either too compact (unreadable) or too verbose (wastes space). **human-json** finds the perfect balance:

```javascript
// Standard JSON.stringify() - too compact
{"hobbies":["reading","cycling","photography"],"location":{"city":"Portland","state":"OR"},"name":"Alice","age":30}

// JSON.stringify(obj, null, 2) with spaces - too verbose and order isn't instinctive
{
  "hobbies": [
    "reading",
    "cycling",
    "photography"
  ],
  "location": {
    "city": "Portland",
    "state": "OR"
  },
  "name": "Alice",
  "age": 30
}

// human-json - just right
{
  name: "Alice",
  age: 30,
  location: { city: "Portland", state: "OR" },
  hobbies: [ "reading", "cycling", "photography" ]
}
```

## Features

- **Key Sorting**: Alphabetical ordering of keys for consistent output
- **Priority Keys**: Preferred keys always appear first (like `name`, `version`, `id`)
- **Smart Wrapping**: Keeps small objects and arrays on a single line and when they fit
- **Fill**: Avoid one item per line for values that don't fit on one line. Pack the values but fill multiple lines instead
- **Configurable**: Control indentation, line length, sorting, and spacing
- **Extended Type Support**: Supports Maps, Sets, ArrayBuffers, and custom objects that implement `.toJSON()` methods

## Installation

```bash
npm install human-json
```

## Usage

### JavaScript API

```javascript
import { HumanJSON } from "human-json";

const data = {
  users: [
    { name: "Alice", age: 30, active: true },
    { name: "Bob", age: 25, active: false },
  ],
  count: 2,
};

console.log(HumanJSON.stringify(data));
```

**Output:**

```json
{
  "count": 2,
  "users": [
    { "active": true, "age": 30, "name": "Alice" },
    { "active": false, "age": 25, "name": "Bob" }
  ]
}
```

### CLI

```bash
# Format a file
human-json input.json

# From stdin
cat data.json | human-json

# Customize formatting
human-json data.json --indent 4 --max-length 100 --keys lastname,firstname,age
```

## Configuration

### JavaScript Configuration

You can use the static method (recommended for simple cases):

```javascript
import { HumanJSON } from "human-json";

// Static method - simplest usage
const formatted = HumanJSON.stringify(data, 2, 80, {
  sortKeys: true,
  firstKeys: ["name", "id", "version"],
  spacing: 'object',
  fill: 'array',
});
```

Or create an instance for reuse:

```javascript
// Instance method - better for multiple calls with same settings
const formatter = new HumanJSON(2, 80, {
  sortKeys: true,              // Sort object keys alphabetically (default: true)
  firstKeys: ["name", "id", "version"], // Keys to prioritize at the top
  spacing: 'object',           // Add spaces around {} or []. Options: 'all', 'none', 'object', 'array' (default: 'object')
  fill: 'array',               // Dense wrapping for simple values. Options: 'none', 'array', 'object', 'all' (default: 'array')
  appendNewLine: true,         // Append newline at end (default: true)
});

const formatted = formatter.stringify(data);
```

**Options:**

- `indentSpaces` (number): Number of spaces per indent level (default: 2)
- `maxLineLength` (number): Maximum line length before wrapping (default: 120)
- `sortKeys` (boolean): Sort object keys alphabetically (default: true)
- `firstKeys` (string[]): Keys to prioritize at the top when sorting (default: `["name", "id", "value", "version", "date", "errors"]`)
- `spacing` ('none' | 'array' | 'object' | 'all'): Add spaces around brackets/braces (default: 'object')
- `fill` ('none' | 'array' | 'object' | 'all'): Enable dense wrapping for simple values (default: 'array')
- `appendNewLine` (boolean): Append newline at end of output (default: true)

### CLI Options

| Option             | Description                          | Default         |
| ------------------ | ------------------------------------ | --------------- |
| `--indent N`       | Spaces per indent level              | 2               |
| `--max-length N`   | Maximum line length                  | 120             |
| `--keys key1,key2` | Keys to stay first (comma-separated) | name,id,value,version,date,errors |

## Examples

Check the `examples/` directory for real-world input/output pairs. Files ending with `~human.json` show the formatted output.
