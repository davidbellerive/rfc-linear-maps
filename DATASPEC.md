# Data Specification (Planned)

This document defines the **planned** data model for `linear-maps` as the project adds support for:

1. Multi-row station labels (manual `~` line breaks)
2. Station icons / markers (`{}` metadata block)
3. Branching / geometry variability (optional secondary geometry file)

The goal is to keep the **primary CSV** simple for linear (single-baseline) maps, while enabling advanced layouts through an optional geometry spec.

---

## 1) Primary CSV: `lines.csv` (baseline / backward compatible)

### Required header (planned)
```csv
system,region,line_name,years,color_r,color_g,color_b,stations
```

### Column definitions

- **system** *(string)*  
  Operator / network name (e.g., `OC Transpo`, `STM`, `TTC`).

- **region** *(string)*  
  City / metro area / region (e.g., `Ottawa`, `Montréal`, `Toronto`).

- **line_name** *(string)*  
  A specific map variant name (e.g., `Line 1 - Stage 2 East`).

- **years** *(string)*  
  Display years for the variant (e.g., `2019`, `2001-2020`, `TBD`).

- **color_r / color_g / color_b** *(0–255 integers)*  
  RGB color for the line stroke.

- **stations** *(string)*  
  A **pipe-delimited** list of station tokens:  
  `StationA|StationB|StationC`

---

## 2) Station token model (planned)

A station token is the smallest unit inside the `stations` column.  
Stations are separated at the top level by the pipe delimiter `|`.

### 2.1 Station label (default)
```text
Station Name
```

Example:
```text
Tunney’s Pasture|Bayview|Pimisi
```

### 2.2 Multi-row station labels (manual line breaks)

Use `~` to force a line break **inside a station label**.

```text
Label line 1~Label line 2
```

Example:
```text
Parliament~Parlement
```

Notes:
- `~` affects **label layout only**.
- The script will convert `~` to Illustrator line breaks internally.

### 2.3 Station icons / markers (inline metadata block)

Attach icons to a station token using a curly-brace block `{}` appended to the label:

```text
StationName{icon1,icon2}
```

#### Multiple icons
```text
Bayview{transfer,o-train}
```

#### Per-icon scale overrides
Each icon may specify a scale multiplier using `:`.

```text
Bayview{transfer:1.5,o-train:1}
```

Rules:
- If scale is omitted, default is `1.0`.
- Whitespace inside `{}` should be ignored by the parser.

#### Combined example (label + line breaks + icons)
```text
Parliament~Parlement{transfer:1.4,bus:1}
```

---

## 3) Icon assets (planned)

Icons are loaded from a local folder relative to the script runtime:

```text
/assets/icons/
```

Lookup order per icon key:
1. `assets/icons/<key>.svg` *(preferred)*
2. `assets/icons/<key>.png` *(fallback)*

Missing assets should **warn and skip** (no hard failure).

### Icon layout configuration (planned)
To support stations with many icons, icon placement supports row wrapping.

Recommended config variables (names may change during implementation):
- `maxIconsPerRow`
- `iconXGap`
- `iconYGap`
- `iconYOffset`
- `iconBaseScale` (+ optional min/max clamps)

---

## 4) Branching / geometry variability (planned)

Branching cannot be expressed cleanly inside the CSV station list without turning the CSV into punctuation-heavy syntax.  
Instead, branching will be enabled via an **optional secondary geometry file**.

### 4.1 Backward compatibility rule
- If the geometry file is **absent**: use the current single-baseline renderer.
- If the geometry file is **present**: override the default layout and render using geometry-driven path/lane rules.

### 4.2 Station identity requirement
Branching requires stable station identifiers.
- The geometry file references stations by **station IDs**.
- The CSV remains the display registry (label text, `~` breaks, `{}` icons).
- IDs may be derived deterministically or defined explicitly later (implementation detail).

### 4.3 Geometry file format (recommended)
Recommended: JSON (e.g., `geometry.json`)

Illustrative example:
```json
{
  "layout": {
    "baseAngle": 45,
    "laneOffset": 1.2,
    "laneXJoinLength": 1.0,
    "centerTrunk": true,
    "clearanceLabel": 1.0,
    "clearanceIcon": 1.0,
    "trunkStyle": "neutral"
  },
  "paths": [
    {
      "id": "A",
      "color": "#2B6CB0",
      "stations": ["a","b","c","d","e","f"]
    },
    {
      "id": "B",
      "color": "#E53E3E",
      "stations": ["a","b","c","d","g","h"],
      "splits": [
        { "at": "d", "direction": "up", "angle": 45 }
      ]
    }
  ]
}
```

### 4.4 Layout principle (branching)
When branching is enabled:
- The trunk is centered vertically.
- Branches expand upward/downward via angled split connectors.
- Branch lanes continue parallel at constant offsets.

---

## 5) Examples (current CSV-compatible)

### Simple (single-line labels)
```csv
system,region,line_name,years,color_r,color_g,color_b,stations
OC Transpo,Ottawa,Line 2 - Trillium Line,2001-2020,80,129,40,Bayview|Dow’s Lake|Carleton|Mooney’s Bay|Greenboro
```

### Multi-row label + icons (planned token model)
```csv
system,region,line_name,years,color_r,color_g,color_b,stations
OC Transpo,Ottawa,Line 1 - Confederation Line,2019,211,15,29,Parliament~Parlement{transfer:1.4}|Rideau{mall}|uOttawa|Hurdman|Tremblay{via}
```

---

## 6) Notes and non-goals (for now)

- The primary CSV is intended to remain easy to edit in spreadsheet tools.
- Advanced topology (branching/merges/loops) belongs in the geometry file.
- Automatic text wrapping is not part of the base token model; `~` provides manual control.
