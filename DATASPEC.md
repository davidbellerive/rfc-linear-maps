# Data Specification (JSON v1)

This document defines the **current JSON data model** for `linear-maps` with **per-line JSON files**.

Design goals:

- Keep line files **small and PR-friendly**
- Allow **multi-line station names**
- Allow **station icons** with **per-icon scale**
- Keep **rendering style** (label angles, spacing, icon layout, etc.) in `configuration.json` (not in data)

---

## 1) File layout and discovery

Line JSON files live under a `/data` folder and are discovered **recursively**.

Recommended structure:

```
/data/<region>/<system>/<line>.json
```

**All folders under `/data` are optional**:

- `/data/<line>.json`
- `/data/<region>/<line>.json`
- `/data/<region>/<system>/<line>.json`

### Region/system inference rule

If `region` and/or `system` are missing from the JSON file, the renderer may infer them from folder names:

- `/data/<region>/<system>/<line>.json` → region=`<region>`, system=`<system>`
- `/data/<region>/<line>.json` → region=`<region>`, system=`""`
- `/data/<line>.json` → region=`""`, system=`""`

> It is recommended to include both `region` and `system` in the JSON **even if** your folders already provide them.

---

## 2) Per-line JSON format (`line.json`)

### Top-level structure (v1)

```json
{
  "region": "ottawa",
  "system": "oc-transpo",
  "line": {
    "id": "line4-2025",
    "name": ["Line 4", "Airport Link"],
    "color": "#0980A5",
    "stations": [
      "South Keys",
      "Uplands",
      {
        "name": ["Airport", "Aéroport"],
        "icons": [
          { "key": "airport", "scale": 1.25 }
        ]
      }
    ]
  }
}
```

---

## 3) Value definitions

### 3.1 Root values

- **region** *(string, optional)*  
  Region/city identifier (e.g., `"ottawa"`, `"montreal"`).  
  Used primarily for export folder templates and organization.

- **system** *(string, optional)*  
  System/operator identifier (e.g., `"oc-transpo"`, `"stm"`).  
  Used primarily for export folder templates and organization.

- **line** *(object, required)*  
  The line definition object (see below).

### 3.2 `line` object

- **line.id** *(string, required)*  
  Stable identifier for this line variant.  
  Example: `"line4-2025"`, `"line2-2001-2020"`.

- **line.name** *(string OR array of strings, required)*  
  Display name of the line. Multi-line names are supported via an array.  
  Examples:
  - `"Line 4"`
  - `["Line 4", "Airport Link"]`
  - `["Trillium Line", "2001–2020"]`

- **line.color** *(string, required)*  
  Line stroke color as **HEX** in the form `#RRGGBB`.  
  Example: `"#0980A5"`

- **line.stations** *(array, required; must contain 2+ stations)*  
  Ordered station list. Each entry is either a string or an object (see below).

---

## 4) Station model

Each entry in `line.stations[]` may be:

1) A **string** (simple station), or  
2) An **object** (multi-line and/or icons)

### 4.1 Simple station (string)

```json
"Uplands"
```

### 4.2 Station object

```json
{
  "name": "Uplands"
}
```

A station object with only `"name"` is valid but generally unnecessary unless you need icons or multi-line text.

### 4.3 Multi-line station name

```json
{
  "name": ["Airport", "Aéroport"]
}
```
Multi-line station names will render in the order listed. 

### 4.4 Station with icons + per-icon scale

```json
{
  "name": ["Airport", "Aéroport"],
  "icons": [
    { "key": "airport", "scale": 1.25 },
    { "key": "transfer", "scale": 1.10 }
  ]
}
```

#### Icon fields

- **key** *(string, required)*  
  Icon identifier; also the file stem used for lookup (see §5).

- **scale** *(number, optional)*  
  Multiplier applied to the icon size. Default is `1.0`.

---

## 5) Icon assets

Icons are looked up implicitly by `key` in a default folder relative to the script runtime.

Default concept:

```
./icons/<key>.svg
```

Examples:

- `key = "airport"` → `./icons/airport.svg`
- `key = "transfer"` → `./icons/transfer.svg`

### Missing icons

Missing icon files should be **warned and skipped** (no hard failure).

---

## 6) Future-proofing (planned extensions)

These keys are reserved for future enhancements without breaking v1 files:

### 7.1 Multi-route / branching (planned)

A future renderer may support optional `line.routes[]`:

```json
{
  "line": {
    "id": "example-branch",
    "name": "Example Branch",
    "color": "#FF0000",
    "routes": [
      { "id": "main", "stations": ["A", "B", "C", "D"] },
      { "id": "branch", "stations": ["B", "E", "F"] }
    ]
  }
}
```

Backward compatibility rule:

- If `routes` exists → render routes-based topology  
- Else → render `stations` as a single baseline

### 7.2 Metadata (optional)

A future `metadata` object may be introduced for editorial notes or tags, without affecting rendering.

---

## 7) Example: "Sampler" line showing station combinations (also in the /data folder)

```json
{
  "version": 1,
  "region": "ottawa",
  "system": "oc-transpo",
  "line": {
    "id": "airport-sampler",
    "name": ["Airport", "Sampler of combinations"],
    "color": "#0980A5",
    "stations": [
      {
        "name": ["Airport", "Aéroport"],
        "icons": [
          { "key": "airport", "scale": 1.25 },
          { "key": "transfer", "scale": 1.1 }
        ]
      },
      {
        "name": ["Airport", "Aéroport"],
        "icons": [
          { "key": "airport", "scale": 1.25 }
        ]
      },
      {
        "name": ["Airport", "Aéroport"]
      },
      {
        "name": "Airport"
      },
      "Airport"
    ]
  }
}
```

---

## 8) Export structure (config-driven)

Exports are controlled by `configuratio.json`.

Recommended defaults:

- `EXPORT_DESTINATION_FOLDER`: `"exports-svg"` (relative to `/data`)
- `EXPORT_LOCATION_TEMPLATE`: `"{base}/{region}/{system}"`

This yields:

```
exports-svg/<region>/<system>/<filename>.svg
```

If `region` or `system` are blank, those path segments collapse naturally.

---
