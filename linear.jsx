#target illustrator

(function () {
  // =========================
  // CONFIG
  // =========================
  var CFG_DEFAULTS = {
    ARTBOARD_WIDTH: 1500,
    ARTBOARD_HEIGHT: 300,
    BASELINE_Y: 48,
    H_PADDING: 90,

    AUTO_PAD_TERMINALS: true,
    PAD_RIGHT_MARGIN: 8,
    PAD_LEFT_MARGIN: 8,
    PAD_MAX_EXTRA: 260,
    PAD_CHECK_LEFT: false,

    LINE_STROKE: 16,

    LINE_OUTLINE_ENABLED: false,
    LINE_OUTLINE_WIDTH: 3,
    LINE_OUTLINE_COLOR: { r: 0, g: 0, b: 0 },

    STATION_RADIUS: 10,
    STATION_STROKE_WIDTH: null, // null = auto from LINE_STROKE

    LABEL_MODE: "angled",
    LABEL_TILT: -20,
    LABEL_CLEARANCE: 10,
    LABEL_X_NUDGE: -6,

    // Fonts (independent, with fallback to ArialMT)
    FONT_LABEL_NAME: "ArialMT",
    FONT_TITLE_NAME: "ArialMT",
    FONT_SUBTITLE_NAME: "ArialMT",
    FONT_FOOTER_NAME: "ArialMT",

    FONT_SIZE: 18,

    STATION_OUTLINE: { r: 0, g: 0, b: 0 },

    // Footer
    FOOTER_TEXT: "Rail Fans Canada — 2026",
    FOOTER_FONT_SIZE: 11,
    FOOTER_COLOR: { r: 155, g: 155, b: 155 },
    FOOTER_BOTTOM_MARGIN: 15,

    // Title
    DRAW_TITLE: true,
    TITLE_TEMPLATE: "{name}{years_paren}", // tokens: {system} {id} {name} {years} {years_paren}
    TITLE_FONT_SIZE: 44,
    TITLE_COLOR: { r: 0, g: 0, b: 0 },
    TITLE_LEFT: 14,
    TITLE_TOP_FROM_TOP: 18,

    // Subtitle
    DRAW_SUBTITLE: false,
    SUBTITLE_TEMPLATE: "{system}", // tokens: {system} {id} {name} {years} {years_paren}
    SUBTITLE_FONT_SIZE: 18,
    SUBTITLE_COLOR: { r: 90, g: 90, b: 90 },
    SUBTITLE_LEFT: 14,         // used only when no title exists
    SUBTITLE_TOP_FROM_TOP: 70,

    // Dynamic height
    AUTO_HEIGHT: true,
    MIN_HEIGHT: 220,

    RESERVE_TITLE_BAND: true,
    TITLE_BAND_PADDING: 10,
    TITLE_BAND_LINE_GAP: 10,

    // Export
    EXPORT_SVG: true,

    // If empty: export into the /data folder (same base as input).
    // If set:
    //   - absolute path: "C:/path/to/output" or "/Users/name/output"
    //   - relative path: "exports-svg" (relative to /data folder)
    EXPORT_DESTINATION_FOLDER: "",

    // Where to export inside the base folder. Tokens:
    // {base} {region} {system} {id}
    // Example: "{base}/{region}/{system}"
    EXPORT_LOCATION_TEMPLATE: "{base}/{region}/{system}",

    // Output file name (without extension). Tokens: {system} {id} {name} {years} {years_paren}
    EXPORT_FILENAME_TEMPLATE: "{name}",

    OUTLINE_TEXT_FOR_SVG: true,
    CLOSE_AFTER_EXPORT: false
  };

  var CFG = null;

  // =========================
  // Helpers
  // =========================
  function trim(s) { return (s || "").replace(/^\s+|\s+$/g, ""); }

  function getScriptFolder() {
    try { return File($.fileName).parent; }
    catch (e) { return null; }
  }

  function readFile(file) {
    file.encoding = "UTF-8";
    if (!file.open("r")) throw new Error("Unable to open file: " + file.fsName);
    var txt = file.read();
    file.close();
    return txt;
  }

  function safeParseJSON(text) {
    try {
      if (typeof JSON !== "undefined" && JSON.parse) return JSON.parse(text);
    } catch (e1) {}
    try { return eval("(" + text + ")"); } catch (e2) { return null; }
  }

  function isPlainObject(x) {
    return x && (typeof x === "object") && !(x instanceof Array);
  }

  function mergeDeep(base, overrides) {
    for (var k in overrides) {
      if (!overrides.hasOwnProperty(k)) continue;
      var v = overrides[k];
      if (isPlainObject(v) && isPlainObject(base[k])) {
        mergeDeep(base[k], v);
      } else {
        base[k] = v;
      }
    }
    return base;
  }

  function getFontOrArial(fontName) {
    var name = trim(fontName || "");
    if (!name) name = "ArialMT";
    try { return app.textFonts.getByName(name); }
    catch (e) { return app.textFonts.getByName("ArialMT"); }
  }

  function rgb(o) {
    var c = new RGBColor();
    c.red = o.r; c.green = o.g; c.blue = o.b;
    return c;
  }

  function safeFileName(s) {
    return (s || "")
      .replace(/[\\\/\:\*\?\"\<\>\|]/g, "_")
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "");
  }

  function loadConfigFromJSONFile(cfgFile) {
    var raw = trim(readFile(cfgFile));
    if (raw && raw.charCodeAt(0) === 0xFEFF) raw = raw.substring(1);

    var parsed = safeParseJSON(raw);
    if (parsed === null) throw new Error("Invalid JSON in: " + cfgFile.fsName);

    if (parsed.CFG && isPlainObject(parsed.CFG)) return parsed.CFG;
    return parsed;
  }

  function buildConfig() {
    var scriptFolder = getScriptFolder();
    var cfgFile = null;

    if (scriptFolder) {
      var candidate = File(scriptFolder.fsName + "/configuration.json");
      if (candidate.exists) cfgFile = candidate;
    }

    if (!cfgFile) {
      cfgFile = File.openDialog("Select configuration.json", "JSON:*.json");
      if (!cfgFile) throw new Error("No configuration.json selected.");
    }

    var overrides = loadConfigFromJSONFile(cfgFile);

    var cfg = {};
    for (var k in CFG_DEFAULTS) cfg[k] = CFG_DEFAULTS[k];
    mergeDeep(cfg, overrides);

    if (!cfg.FONT_LABEL_NAME) cfg.FONT_LABEL_NAME = "ArialMT";
    if (!cfg.FONT_TITLE_NAME) cfg.FONT_TITLE_NAME = "ArialMT";
    if (!cfg.FONT_SUBTITLE_NAME) cfg.FONT_SUBTITLE_NAME = "ArialMT";
    if (!cfg.FONT_FOOTER_NAME) cfg.FONT_FOOTER_NAME = "ArialMT";

    var unknown = [];
    for (var ok in overrides) {
      if (overrides.hasOwnProperty(ok) && !CFG_DEFAULTS.hasOwnProperty(ok)) unknown.push(ok);
    }
    if (unknown.length) {
      alert(
        "configuration.json contains " + unknown.length + " unknown key(s).\n" +
        "They will still be applied, but double-check for typos:\n\n" +
        unknown.join(", ")
      );
    }

    cfg.__CONFIG_FILE__ = cfgFile;
    return cfg;
  }

  try { CFG = buildConfig(); }
  catch (cfgErr) {
    alert("Config load failed:\n" + cfgErr.message);
    return;
  }

  // =========================
  // JSON line format helpers
  // =========================
  function hexToRGB(hex) {
    hex = trim(hex || "");
    if (!hex) return { r: 0, g: 0, b: 0 };
    if (hex.charAt(0) === "#") hex = hex.substring(1);
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return { r: 0, g: 0, b: 0 };

    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return { r: r, g: g, b: b };
  }

  function normalizeMultilineText(v) {
    if (v === null || v === undefined) return "";
    if (v instanceof Array) {
      var parts = [];
      for (var i = 0; i < v.length; i++) parts.push(String(v[i]));
      return parts.join("\r");
    }
    return String(v);
  }

  function normalizeStationEntry(entry) {
    if (typeof entry === "string") {
      return { text: entry, icons: [] };
    }
    if (isPlainObject(entry)) {
      var name = normalizeMultilineText(entry.name);
      var icons = (entry.icons instanceof Array) ? entry.icons : [];
      return { text: name, icons: icons };
    }
    return { text: "", icons: [] };
  }

  function loadLineJSONFile(file) {
    var raw = trim(readFile(file));
    if (raw && raw.charCodeAt(0) === 0xFEFF) raw = raw.substring(1);

    var parsed = safeParseJSON(raw);
    if (parsed === null) throw new Error("Invalid JSON in: " + file.fsName);

    if (!parsed.line || !isPlainObject(parsed.line)) {
      throw new Error("Missing 'line' object in: " + file.fsName);
    }

    var region = trim(parsed.region);
    var system = trim(parsed.system);

    var lineObj = parsed.line;
    var id = trim(lineObj.id);
    var name = normalizeMultilineText(lineObj.name);
    var colorHex = trim(lineObj.color);
    var stationsRaw = lineObj.stations;

    if (!id) throw new Error("Missing line.id in: " + file.fsName);
    if (!name) throw new Error("Missing line.name in: " + file.fsName);
    if (!colorHex) throw new Error("Missing line.color in: " + file.fsName);
    if (!(stationsRaw instanceof Array) || stationsRaw.length < 2) {
      throw new Error("line.stations must be an array with 2+ entries in: " + file.fsName);
    }

    var stations = [];
    for (var i = 0; i < stationsRaw.length; i++) {
      var st = normalizeStationEntry(stationsRaw[i]);
      if (!trim(st.text)) continue;
      stations.push(st.text);
    }
    if (stations.length < 2) throw new Error("Need 2+ valid stations in: " + file.fsName);

    return {
      region: region,      // may be ""
      system: system,      // may be ""
      id: id,
      name: name,
      years: "",           // kept for template compatibility
      color: hexToRGB(colorHex),
      stations: stations,
      __sourceFile__: file
    };
  }

  // =========================
  // File/folder traversal
  // =========================
  function collectLineJSONFiles(rootFolder) {
    var results = [];

    function walk(folder) {
      var items = folder.getFiles();
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it instanceof Folder) {
          walk(it);
        } else if (it instanceof File) {
          if (/^configuration\.json$/i.test(it.name)) continue;
          if (/\.json$/i.test(it.name)) results.push(it);
        }
      }
    }

    walk(rootFolder);

    results.sort(function (a, b) {
      var A = a.fsName.toLowerCase();
      var B = b.fsName.toLowerCase();
      return A < B ? -1 : (A > B ? 1 : 0);
    });

    return results;
  }

  function inferRegionSystemFromPath(dataFolder, file) {
    var rel = file.parent.fsName;
    var base = dataFolder.fsName;

    rel = rel.split("\\").join("/");
    base = base.split("\\").join("/");

    if (rel.indexOf(base) !== 0) return { region: "", system: "" };

    var tail = rel.substring(base.length);
    if (tail.charAt(0) === "/") tail = tail.substring(1);
    if (!tail) return { region: "", system: "" };

    var parts = tail.split("/");
    var region = (parts.length >= 1) ? parts[0] : "";
    var system = (parts.length >= 2) ? parts[1] : "";

    return { region: region, system: system };
  }

  function loadAllLinesFromDataFolder(dataFolder) {
    var files = collectLineJSONFiles(dataFolder);
    if (!files.length) throw new Error("No line JSON files found under: " + dataFolder.fsName);

    var lines = [];
    for (var i = 0; i < files.length; i++) {
      var L = loadLineJSONFile(files[i]);

      var inferred = inferRegionSystemFromPath(dataFolder, files[i]);
      if (!trim(L.region) && trim(inferred.region)) L.region = inferred.region;
      if (!trim(L.system) && trim(inferred.system)) L.system = inferred.system;

      lines.push(L);
    }
    return lines;
  }

  // =========================
  // Layout helpers
  // =========================
  function getLabelRotation() {
    if (CFG.LABEL_MODE === "vertical") return 90;
    return 90 + CFG.LABEL_TILT;
  }

  function getArtboardHeight(doc) {
    var r = doc.artboards[0].artboardRect;
    return r[1] - r[3];
  }

  function addWhiteBackground(doc) {
    var H = getArtboardHeight(doc);
    var bg = doc.pathItems.rectangle(H, 0, CFG.ARTBOARD_WIDTH, H);
    bg.stroked = false;
    bg.filled = true;
    bg.fillColor = rgb({ r: 255, g: 255, b: 255 });
    bg.zOrder(ZOrderMethod.SENDTOBACK);
    bg.locked = true;
    bg.name = "bg-white";
    return bg;
  }

  function getMaxTopOfTextFrames(doc) {
    var maxTop = 0;
    for (var i = 0; i < doc.textFrames.length; i++) {
      var tf = doc.textFrames[i];
      try {
        var gb = tf.geometricBounds;
        maxTop = Math.max(maxTop, gb[1]);
      } catch (e) {}
    }
    return maxTop;
  }

  function resizeArtboardHeight(doc, newH) {
    var ab = doc.artboards[0];
    ab.artboardRect = [0, newH, CFG.ARTBOARD_WIDTH, 0];

    for (var i = doc.pathItems.length - 1; i >= 0; i--) {
      var p = doc.pathItems[i];
      if (p.name === "bg-white") {
        try { p.locked = false; } catch (e1) {}
        try { p.remove(); } catch (e2) {}
        break;
      }
    }
    addWhiteBackground(doc);
  }

  function estimateTitleBandHeight() {
    return (CFG.TITLE_FONT_SIZE * 1.35) + CFG.TITLE_BAND_PADDING;
  }

  function outlineAllText(doc) {
    for (var i = doc.textFrames.length - 1; i >= 0; i--) {
      var tf = doc.textFrames[i];
      try {
        tf.createOutline();
        tf.remove();
      } catch (e) {}
    }
  }

  function drawFooter(doc, text, fontObj) {
    if (!text) return;

    var footer = doc.textFrames.add();
    footer.contents = text;
    footer.textRange.characterAttributes.size = CFG.FOOTER_FONT_SIZE;
    footer.textRange.characterAttributes.textFont = fontObj;
    footer.textRange.paragraphAttributes.justification = Justification.CENTER;
    footer.textRange.characterAttributes.fillColor = rgb(CFG.FOOTER_COLOR);

    footer.left = 0;
    footer.top = CFG.FOOTER_BOTTOM_MARGIN;

    var gb = footer.geometricBounds;
    var w = gb[2] - gb[0];
    footer.left = (CFG.ARTBOARD_WIDTH - w) / 2;
  }

  function applyTemplate(tpl, L) {
    var years = trim(L.years || "");
    var yearsParen = years ? (" (" + years + ")") : "";

    var s = tpl || "";
    s = s.split("{system}").join(L.system || "");
    s = s.split("{id}").join(L.id || "");
    s = s.split("{name}").join(L.name || "");
    s = s.split("{years}").join(years);
    s = s.split("{years_paren}").join(yearsParen);

    return s;
  }

  function getOutlinedLeft(tf) {
    var dup = null;
    var g = null;
    try {
      dup = tf.duplicate();
      dup.hidden = true;
      app.redraw();

      g = dup.createOutline();
      app.redraw();

      var gb = g.geometricBounds;
      var left = gb[0];

      try { g.remove(); } catch (e1) {}
      try { dup.remove(); } catch (e2) {}

      return left;
    } catch (e) {
      try { if (g) g.remove(); } catch (e3) {}
      try { if (dup) dup.remove(); } catch (e4) {}
      try { return tf.geometricBounds[0]; } catch (e5) { return tf.left; }
    }
  }

  function snapTextOutlineLeft(tf, targetX) {
    var leftNow = getOutlinedLeft(tf);
    var dx = targetX - leftNow;
    tf.left += dx;
    app.redraw();
    return getOutlinedLeft(tf);
  }

  function drawTitle(doc, L, fontObj) {
    if (!CFG.DRAW_TITLE) return null;

    var text = applyTemplate(CFG.TITLE_TEMPLATE, L);
    if (!trim(text)) return null;

    var H = getArtboardHeight(doc);

    var title = doc.textFrames.add();
    title.contents = text;
    title.textRange.characterAttributes.size = CFG.TITLE_FONT_SIZE;
    title.textRange.characterAttributes.textFont = fontObj;
    title.textRange.characterAttributes.fillColor = rgb(CFG.TITLE_COLOR);
    title.textRange.paragraphAttributes.justification = Justification.LEFT;

    title.left = CFG.TITLE_LEFT;
    title.top  = H - CFG.TITLE_TOP_FROM_TOP;

    var titleOutlineLeft = snapTextOutlineLeft(title, CFG.TITLE_LEFT);

    return { frame: title, outlineLeft: titleOutlineLeft };
  }

  function drawSubtitle(doc, L, fontObj, alignOutlineLeftToX) {
    if (!CFG.DRAW_SUBTITLE) return null;

    var text = applyTemplate(CFG.SUBTITLE_TEMPLATE, L);
    if (!trim(text)) return null;

    var H = getArtboardHeight(doc);

    var sub = doc.textFrames.add();
    sub.contents = text;
    sub.textRange.characterAttributes.size = CFG.SUBTITLE_FONT_SIZE;
    sub.textRange.characterAttributes.textFont = fontObj;
    sub.textRange.characterAttributes.fillColor = rgb(CFG.SUBTITLE_COLOR);
    sub.textRange.paragraphAttributes.justification = Justification.LEFT;

    sub.left = CFG.SUBTITLE_LEFT;
    sub.top  = H - CFG.SUBTITLE_TOP_FROM_TOP;

    var target = (alignOutlineLeftToX !== null && alignOutlineLeftToX !== undefined)
      ? alignOutlineLeftToX
      : CFG.SUBTITLE_LEFT;

    snapTextOutlineLeft(sub, target);
    return sub;
  }

  // =========================
  // Export helpers
  // =========================
  function resolveExportBaseFolder(dataFolder) {
    var dest = trim(CFG.EXPORT_DESTINATION_FOLDER || "");
    if (!dest) return dataFolder;

    var isAbs = (/^[A-Za-z]\:/.test(dest) || dest.charAt(0) === "/" || dest.charAt(0) === "\\");
    var f = isAbs ? Folder(dest) : Folder(dataFolder.fsName + "/" + dest);

    if (!f.exists) {
      if (!f.create()) throw new Error("Could not create export destination: " + f.fsName);
    }
    return f;
  }

  function sanitizePathPart(s) {
    return safeFileName(s || "");
  }

  function applyExportLocationTemplate(tpl, baseFolder, L) {
    var t = tpl || "{base}";
    t = t.split("{base}").join(baseFolder.fsName.replace(/\\/g, "/"));
    t = t.split("{region}").join(sanitizePathPart(L.region || ""));
    t = t.split("{system}").join(sanitizePathPart(L.system || ""));
    t = t.split("{id}").join(sanitizePathPart(L.id || ""));

    t = t.replace(/\/+/g, "/").replace(/\/$/g, "");
    return t;
  }

  // mkdir -p for nested folder paths
  function ensureFolderFromPath(pathStr) {
    pathStr = (pathStr || "").replace(/\\/g, "/");
    if (!pathStr) throw new Error("Empty export folder path");

    // Handle Windows drive letter "C:/..."
    var drive = "";
    if (/^[A-Za-z]\:\//.test(pathStr)) {
      drive = pathStr.substring(0, 3); // "C:/"
      pathStr = pathStr.substring(3); // rest
    }

    var isAbsUnix = (pathStr.charAt(0) === "/");
    if (isAbsUnix) pathStr = pathStr.substring(1);

    var parts = pathStr.split("/");
    var curPath = drive ? drive : (isAbsUnix ? "/" : "");

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (!part) continue;
      curPath = curPath ? (curPath.replace(/\/$/, "") + "/" + part) : part;

      var f = Folder(curPath);
      if (!f.exists) {
        if (!f.create()) throw new Error("Could not create export folder: " + f.fsName);
      }
    }

    return Folder(drive + (isAbsUnix ? "/" : "") + pathStr);
  }

  function exportAsSVG(doc, destFile) {
    var opts = new ExportOptionsSVG();
    opts.embedRasterImages = true;
    opts.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;
    opts.coordinatePrecision = 2;
    opts.cssProperties = SVGCSSPropertyLocation.PRESENTATIONATTRIBUTES;
    doc.exportFile(destFile, ExportType.SVG, opts);
  }

  function measureLabelOverhang(doc, text, anchorX, anchorY, rotation, fontObj) {
    var tf = doc.textFrames.add();
    tf.contents = text;
    tf.textRange.characterAttributes.size = CFG.FONT_SIZE;
    tf.textRange.characterAttributes.textFont = fontObj;
    tf.textRange.paragraphAttributes.justification = Justification.LEFT;

    tf.left = anchorX;
    tf.top  = anchorY;
    tf.rotate(rotation);

    var gb = tf.geometricBounds;
    tf.left += (anchorX - gb[0]);
    tf.left += CFG.LABEL_X_NUDGE;

    gb = tf.geometricBounds;
    var minX = gb[0];
    var maxX = gb[2];

    tf.remove();

    return {
      leftOverhang: Math.max(0, anchorX - minX),
      rightOverhang: Math.max(0, maxX - anchorX)
    };
  }

  function computeTerminalExtraPadding(doc, stations, basePad, rotation, fontObj, baselineY) {
    var lineLeft = basePad;
    var lineRight = CFG.ARTBOARD_WIDTH - basePad;

    var firstX = lineLeft;
    var lastX  = lineRight;

    var extraLeft = 0;
    var extraRight = 0;

    var lastText = stations[stations.length - 1];
    var mLast = measureLabelOverhang(doc, lastText, lastX, baselineY, rotation, fontObj);

    extraRight = Math.min(
      CFG.PAD_MAX_EXTRA,
      Math.max(0, (mLast.rightOverhang + CFG.PAD_RIGHT_MARGIN) - basePad)
    );

    if (CFG.PAD_CHECK_LEFT) {
      var firstText = stations[0];
      var mFirst = measureLabelOverhang(doc, firstText, firstX, baselineY, rotation, fontObj);
      extraLeft = Math.min(
        CFG.PAD_MAX_EXTRA,
        Math.max(0, (mFirst.leftOverhang + CFG.PAD_LEFT_MARGIN) - basePad)
      );
    }

    return { extraLeft: extraLeft, extraRight: extraRight };
  }

  // =========================
  // Locate /data folder and load JSON lines
  // =========================
  var scriptFolder = getScriptFolder();
  var dataFolder = null;

  if (scriptFolder) {
    var candidateData = Folder(scriptFolder.fsName + "/data");
    if (candidateData.exists) dataFolder = candidateData;
  }

  if (!dataFolder) {
    dataFolder = Folder.selectDialog("Select /data folder (contains per-line JSON files)");
    if (!dataFolder) {
      alert("No /data folder selected.");
      return;
    }
  }

  var LINES;
  try { LINES = loadAllLinesFromDataFolder(dataFolder); }
  catch (eLoad) {
    alert("Failed to load line JSON:\n" + eLoad.message);
    return;
  }

  if (!LINES.length) {
    alert("No valid line JSON files found under:\n" + dataFolder.fsName);
    return;
  }

  // =========================
  // Export base folder
  // =========================
  var exportBaseFolder = null;
  if (CFG.EXPORT_SVG) {
    try { exportBaseFolder = resolveExportBaseFolder(dataFolder); }
    catch (eDest) {
      alert(eDest.message);
      return;
    }
  }

  // =========================
  // Fonts
  // =========================
  var labelFontObj = getFontOrArial(CFG.FONT_LABEL_NAME);
  var titleFontObj = getFontOrArial(CFG.FONT_TITLE_NAME);
  var subtitleFontObj = getFontOrArial(CFG.FONT_SUBTITLE_NAME);
  var footerFontObj = getFontOrArial(CFG.FONT_FOOTER_NAME);

  var stationStroke = rgb(CFG.STATION_OUTLINE);
  var labelRotation = getLabelRotation();

  // =========================
  // Generate docs
  // =========================
  for (var li = 0; li < LINES.length; li++) {
    var L = LINES[li];

    var doc = app.documents.add(DocumentColorSpace.RGB, CFG.ARTBOARD_WIDTH, CFG.ARTBOARD_HEIGHT);
    doc.rulerUnits = RulerUnits.Pixels;

    doc.artboards[0].artboardRect = [0, CFG.ARTBOARD_HEIGHT, CFG.ARTBOARD_WIDTH, 0];
    addWhiteBackground(doc);

    var baselineY = CFG.BASELINE_Y;

    var padLeft = CFG.H_PADDING;
    var padRight = CFG.H_PADDING;

    if (CFG.AUTO_PAD_TERMINALS) {
      var extras = computeTerminalExtraPadding(doc, L.stations, CFG.H_PADDING, labelRotation, labelFontObj, baselineY);
      padLeft  = CFG.H_PADDING + extras.extraLeft;
      padRight = CFG.H_PADDING + extras.extraRight;
    }

    var lineLeft = padLeft;
    var lineRight = CFG.ARTBOARD_WIDTH - padRight;

    if (lineRight - lineLeft < 200) {
      lineLeft = CFG.H_PADDING;
      lineRight = CFG.ARTBOARD_WIDTH - CFG.H_PADDING;
    }

    var spacing = (lineRight - lineLeft) / (L.stations.length - 1);

    if (CFG.LINE_OUTLINE_ENABLED) {
      var outline = doc.pathItems.add();
      outline.stroked = true;
      outline.filled = false;
      outline.strokeWidth = CFG.LINE_STROKE + (CFG.LINE_OUTLINE_WIDTH * 2);
      outline.strokeCap = StrokeCap.ROUNDENDCAP;
      outline.strokeColor = rgb(CFG.LINE_OUTLINE_COLOR);
      outline.setEntirePath([[lineLeft, baselineY], [lineRight, baselineY]]);
    }

    var mainLine = doc.pathItems.add();
    mainLine.stroked = true;
    mainLine.filled = false;
    mainLine.strokeWidth = CFG.LINE_STROKE;
    mainLine.strokeCap = StrokeCap.ROUNDENDCAP;
    mainLine.strokeColor = rgb(L.color);
    mainLine.setEntirePath([[lineLeft, baselineY], [lineRight, baselineY]]);

    var white = new RGBColor();
    white.red = 255; white.green = 255; white.blue = 255;

    var lineTopY = baselineY + (CFG.LINE_STROKE / 2);

    for (var i = 0; i < L.stations.length; i++) {
      var x = lineLeft + i * spacing;

      var dot = doc.pathItems.ellipse(
        baselineY + CFG.STATION_RADIUS,
        x - CFG.STATION_RADIUS,
        CFG.STATION_RADIUS * 2,
        CFG.STATION_RADIUS * 2
      );
      dot.filled = true;
      dot.stroked = true;
      dot.fillColor = white;
      dot.strokeColor = stationStroke;

      var stationStrokeWidth =
        (CFG.STATION_STROKE_WIDTH !== null && CFG.STATION_STROKE_WIDTH !== undefined)
          ? CFG.STATION_STROKE_WIDTH
          : Math.max(2, Math.round(CFG.LINE_STROKE * 0.35));

      dot.strokeWidth = stationStrokeWidth;

      var label = doc.textFrames.add();
      label.contents = L.stations[i];
      label.textRange.characterAttributes.size = CFG.FONT_SIZE;
      label.textRange.characterAttributes.textFont = labelFontObj;
      label.textRange.paragraphAttributes.justification = Justification.LEFT;

      label.left = x;
      label.top = baselineY;

      label.rotate(labelRotation);

      var gb = label.geometricBounds;
      label.left += (x - gb[0]);
      label.left += CFG.LABEL_X_NUDGE;

      gb = label.geometricBounds;
      label.top += ((lineTopY + CFG.LABEL_CLEARANCE) - gb[3]);
    }

    drawFooter(doc, CFG.FOOTER_TEXT, footerFontObj);

    if (CFG.AUTO_HEIGHT) {
      var maxTextTop = getMaxTopOfTextFrames(doc);

      var reserve = 0;
      if (CFG.DRAW_TITLE && CFG.RESERVE_TITLE_BAND) {
        reserve = estimateTitleBandHeight() + CFG.TITLE_TOP_FROM_TOP + CFG.TITLE_BAND_LINE_GAP;
      }

      var neededH = Math.ceil(Math.max(CFG.MIN_HEIGHT, maxTextTop + reserve));
      resizeArtboardHeight(doc, neededH);
    }

    var titleInfo = drawTitle(doc, L, titleFontObj);
    var titleOutlineLeft = titleInfo ? titleInfo.outlineLeft : null;
    drawSubtitle(doc, L, subtitleFontObj, titleOutlineLeft);

    if (CFG.EXPORT_SVG && exportBaseFolder) {
      var targetFolder = exportBaseFolder;

      try {
        var targetPath = applyExportLocationTemplate(CFG.EXPORT_LOCATION_TEMPLATE, exportBaseFolder, L);
        targetFolder = ensureFolderFromPath(targetPath);
      } catch (eLoc) {
        alert("Could not resolve export folder for line:\n" + (L.id || L.name) + "\n\n" + eLoc.message);
        targetFolder = exportBaseFolder;
      }

      var baseName = applyTemplate(CFG.EXPORT_FILENAME_TEMPLATE, L);
      baseName = safeFileName(baseName);
      if (!baseName) baseName = safeFileName(L.name || (L.system + "-" + L.id));

      var svgFile = File(targetFolder.fsName + "/" + baseName + ".svg");

      try {
        if (CFG.OUTLINE_TEXT_FOR_SVG) outlineAllText(doc);
        exportAsSVG(doc, svgFile);
      } catch (eSvg) {
        alert("SVG export failed for:\n" + baseName + "\n\n" + eSvg.message);
      }

      if (CFG.CLOSE_AFTER_EXPORT) {
        doc.close(SaveOptions.DONOTSAVECHANGES);
      }
    }
  }

  var exportMsg = "";
  if (CFG.EXPORT_SVG) {
    exportMsg = "\n\nExported SVGs to:\n" + exportBaseFolder.fsName +
      "\n(Using EXPORT_LOCATION_TEMPLATE: " + CFG.EXPORT_LOCATION_TEMPLATE + ")";
  }

  alert("Generated " + LINES.length + " diagrams from:\n" + dataFolder.fsName + exportMsg);
})();