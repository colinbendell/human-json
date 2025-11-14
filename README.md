# human-json

A Human readable JSON formatter. Zero dependencies.

Simply replace: `JSON.stringify(obj)` --> `HumanJSON.stringify(obj)`

## Example Output

Noticice: key sorting, `Name` has priority, collapsed output, and dense wrapping for arrays

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

- **Key Sorting**: Alphabetical ordering of keys
- **Priority Keys**: Preffered keys always go first (like `name`, `version`)
- **Collapsed output**: try to keep whole objects/arrays in one line
- **Dense Wrapping**: For arrays, don't have one item per line, fill a line and wrap groups
- **Configurable**: Control indentation, line length, sorting, and padding
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
humanjson input.json

# From stdin
cat data.json | human-json

# Customize formatting
humanjson data.json --indent 4 --max-length 100 --keys lastname,firstname,age
```

## Configuration

### JavaScript Options

```javascript
const formatter = new HumanJSON(2, 80, {
  sortKeys: true, // Sort object keys alphabetically
  padding: true, // Add spaces around { } and [ ]
  denseWrapArrays: true, // Pack arrays on one line (only if all items are string/number/bool)
  denseWrapObject: false, // Pack simple objects on one line (only if all values are string/number/bool )
  keys: ["name", "id", "version"], // Keys to always show first
});
```

### CLI Options

| Option             | Description                     | Default         |
| ------------------ | ------------------------------- | --------------- |
| `--indent N`       | Spaces per indent level         | 2               |
| `--max-length N`   | Maximum line length             | 80              |
| `--keys key1,key2` | Priority keys (comma-separated) | name,version,id |

## Examples

Look in `examples` and `examples/output` for some real-world input/outputs
