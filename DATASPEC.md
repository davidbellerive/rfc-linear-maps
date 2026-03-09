# Linear Maps — Data Specification (v2)

## Overview

Maps are defined using a **two-file structure** per system:

| File | Purpose |
|---|---|
| `stations.json` | System-level registry: station definitions, network topology, metadata |
| `<line-name>.json` | Per-line renderer instruction: ordered station IDs, color, export config |

This separation means station labels, bilingual names, icons, and connection metadata are defined once and reused across any number of line files that reference the same system.

---

## Folder layout

```
linear.jsx
linear-config.json
lines/
  ottawa/
    stations.json
    confederation-stage1.json
    confederation-stage2-east.json
    trillium.json
  vancouver/
    stations.json
    millennium.json
```

The script detects system subfolders automatically. If no subfolders are found, it falls back to treating the selected folder as a flat list of line files (legacy mode — see below).

---

## `stations.json`

One file per system folder. Defines the station registry, network topology, and system metadata.

### Top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `system` | string | yes | Operator / network name. Used by `{system}` token. |
| `region` | string | yes | City / metro / region. Used by `{region}` token. |
| `network` | object | no | Map of line IDs to display properties (used for connection markers). |
| `stations` | object | yes | Map of station ID → station definition. |

### `network` entry

```json
"network": {
  "line1": { "label": "Line 1", "color": "#D30F1D" },
  "line2": { "label": "Line 2", "color": "#9DC73C" }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | string | yes | Display name shown in connection marker pills. |
| `color` | string | yes | HEX color for the pill background. |

### Station definition

```json
"stations": {
  "parliament": {
    "label": "Parliament",
    "label2": "Parlement",
    "connections": ["line1", "bus-rapid"],
    "icons": ["via"]
  },
  "bayview": {
    "label": "Bayview",
    "connections": ["line1", "line2"]
  },
  "tunney": {
    "label": "Tunney's Pasture"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | string | yes | Primary display label. |
| `label2` | string | no | Secondary label (bilingual name, subtitle). Rendered as a second line. |
| `connections` | array of strings | no | Line IDs this station connects to. The current line's own ID is filtered out at render time — only transfer targets are shown. |
| `icons` | array of strings | no | Pictogram icon keys (e.g. `"bus"`, `"via"`, `"airport"`). Rendered below the station dot. Not yet implemented in v2 — reserved for issue #2. |

---

## Line file (`<line-name>.json`)

One file per line variant. References station IDs from the system registry.

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Stable line identifier. Must match a key in `network` if connection markers are needed. |
| `line_name` | string | yes | Display name. Used by `{name}` token. |
| `years` | string | no | Display years (`"2019"`, `"2001–2020"`, `"TBD"`). Used by `{years}` and `{years_paren}`. |
| `color` | string | yes | HEX stroke color (`#RRGGBB`). |
| `stations` | array of strings | yes | Ordered list of station IDs from the registry. |

### Example

```json
{
  "id": "line1",
  "line_name": "Line 1 — Confederation Line",
  "years": "2019",
  "color": "#D30F1D",
  "stations": [
    "tunney", "bayview", "pimisi", "lyon", "parliament",
    "rideau", "uottawa", "lees", "hurdman", "tremblay",
    "st-laurent", "cyrville", "blair"
  ]
}
```

`system` and `region` are inherited from `stations.json` and do not need to be repeated in the line file.

---

## Template tokens

Available in `TITLE_TEMPLATE`, `SUBTITLE_TEMPLATE`, and `EXPORT_FILENAME_TEMPLATE`:

| Token | Source |
|---|---|
| `{system}` | `stations.json → system` |
| `{region}` | `stations.json → region` |
| `{id}` | Line file `id` field |
| `{name}` | Line file `line_name` field |
| `{years}` | Line file `years` field |
| `{years_paren}` | `years` wrapped in parentheses, or empty string if no years |

---

## Legacy mode (no `stations.json`)

If no `stations.json` is found in the system folder, the script operates in legacy mode:

- The `stations` array in the line file may contain plain label strings instead of IDs.
- `system` and `region` must be defined directly in the line file.
- No connection markers or bilingual labels are rendered.
- Existing v1 line files work without modification.

---

## Notes

- Colors are HEX only (`#RRGGBB`).
- Station IDs are arbitrary strings but should be stable — the geometry file (issue #3) will reference them by ID.
- `icons` is defined in the schema now but rendering is not yet implemented (tracked in issue #2).
- `label2` renders as a second line using a native Illustrator line break. Label block positioning accounts for multi-line height automatically.
