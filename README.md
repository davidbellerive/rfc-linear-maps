# Illustrator Linear Transit Maps

This repository contains **programmatically generated linear transit maps** used by **Rail Fans Canada (RFC)** to illustrate rapid transit lines and station sequences across Canadian cities.

The maps are designed to be:

- visually consistent  
- SVG-based (infinite resolution)  
- CMS-friendly (Joomla-compatible)  
- usable on mobile without fighting site templates  

The core workflow uses **Adobe Illustrator scripting** to generate maps from a CSV source of truth, and publishes the resulting SVGs for direct embedding on the web.

---

## What this project does

- Generates **clean, minimal linear rail diagrams** (stations + line)
- Automatically handles:
  - long station names
  - angled or vertical labels
  - terminal padding
  - dynamic canvas height
- Exports **static SVG files** that:
  - require no external fonts
  - work without JavaScript
  - can be hosted on GitHub and embedded anywhere

These maps are intended for **editorial and reference use**, not geographic accuracy.

---

## Design principles

### 1. CSV is the source of truth

All maps are generated from a structured CSV containing the following fields, in order:

- **system**  
  A high-level grouping (e.g. `TTC`, `REM`, `Metrolinx`).  
  This value can optionally be used to:
  - create subfolders during export
  - populate subtitles
  - provide contextual grouping across regions or agencies

- **region**  
  A secondary descriptor (e.g. `Toronto`, `Peel`, `Montreal`).  
  This field is **not required to be unique** and may be reused across multiple lines.  
  It is typically used for:
  - subtitles
  - editorial context
  - optional filename templates

- **line name**  
  The human-readable name of the line (e.g. `Line 5 Eglinton`, `Hurontario LRT`).  
  This value is:
  - used for the map title
  - used as the default SVG filename

- **years of operation** *(optional)*  
  Free-form text (e.g. `2024–`, `2002–2017`, `Planned`).  
  If present, it may be injected into title or subtitle templates.  
  If empty, **no parentheses or separators are rendered**.

- **RGB color (R,G,B)**  
  The primary color of the line.

- **station list** (pipe-separated)  
  A linear list of stations in display order.

There is no hard character limit on station names.  
The script dynamically adjusts layout to avoid overlap between:

- title
- subtitle
- station labels

Station names up to **34 characters** have been tested successfully.  
If additional horizontal space is required, padding can be adjusted via configuration.

---

### 2. Configuration is external and editable

All layout, typography, and export behavior is controlled via `linear-config.json`, including:

- independent fonts for:
  - title
  - subtitle
  - station labels
  - footer
- title and subtitle templates using tokens:
  - `{system}`
  - `{region}`
  - `{name}`
  - `{years}`
  - `{years_paren}`
- automatic font fallback to `ArialMT` if a requested font is unavailable
- export destination folder
- optional grouping of outputs by system
- filename templates for exported SVGs

This allows contributors to adapt the tool to new projects **without modifying the script itself**.

---

### 3. SVGs must be self-contained

Because the target site does not host custom fonts:

- all text is converted to **paths**
- no external font dependencies exist
- SVGs render identically across browsers and platforms

---

### 4. CMS-first constraints

The target environment (Joomla) imposes several practical limitations:

- external stylesheets may be blocked
- inline `<script>` tags are often stripped or escaped
- swipe gestures may be hijacked by templates (especially on mobile)

As a result:

- **no JavaScript is required** for normal usage
- all embeds rely on pure HTML with inline styles
- maps scale reasonably well on mobile and degrade gracefully

---

## Illustrator script

The generator script:

- creates one document per CSV row
- dynamically sizes the artboard height based on label extents
- spaces stations evenly along a fixed-width baseline
- supports angled or vertical station labels
- aligns titles and subtitles by **visual left edge**, not anchor point
- exports SVGs using a configurable naming and folder scheme

---

## Typical usage

1. Update `lines.csv`  
2. Update `linear-config.json` (if needed)  
3. Open Adobe Illustrator  
4. Run `linear-map-generator.jsx`  
5. Commit the exported SVGs  

---

## Project status and disclaimer

This project was **not built to any formal software standard**, nor was it originally developed by someone with professional programming experience.

The codebase, including the Illustrator scripting structure, was developed with significant assistance from **large language models (LLMs)**. Human oversight, testing, and iteration were applied, but the resulting code reflects a pragmatic, goal-driven approach rather than a formally engineered one.

As such:

- the codebase should not be considered production-grade software  
- there are no guarantees regarding stability, performance, or long-term maintainability  
- design decisions prioritize practical outcomes over architectural rigor  

Over time, the intent is to **progressively refactor and replace LLM-generated code** with a manually written and better-structured codebase that is more suitable for use beyond the very specific purpose this initial version was meant to accomplish.

Until then, this repository should be viewed as:

- a working tool  
- an evolving experiment  

Use, adapt, and contribute accordingly.
