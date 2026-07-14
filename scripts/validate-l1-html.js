#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "manifest.json");
const MAX_WIDGETS = 5;
const UNSUPPORTED_TAGS = ["table", "ul", "ol", "canvas", "iframe"];
const SAFE_STYLE_PROPERTIES = new Set([
  "color",
  "display",
  "font-size",
  "font-weight",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top"
]);
const SAFE_DISPLAY_VALUES = new Set(["block", "inline", "inline-block", "none"]);

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${path.relative(ROOT, filePath)} is not valid JSON: ${error.message}`);
    return null;
  }
}

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function routeToFile(route) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(route) || route.startsWith("//")) {
    fail(`L1 url must be relative: ${route}`);
    return null;
  }

  const cleanRoute = route.split(/[?#]/)[0];
  const resolved = path.resolve(ROOT, cleanRoute);

  if (!resolved.startsWith(`${ROOT}${path.sep}`) && resolved !== ROOT) {
    fail(`L1 url escapes repository root: ${route}`);
    return null;
  }

  if (cleanRoute.endsWith("/")) {
    return path.join(resolved, "index.html");
  }

  return resolved;
}

function validateNoScripts(html, label) {
  if (/<script\b/i.test(html)) {
    fail(`${label} contains <script>`);
    return;
  }

  pass(`${label} has no <script> tags`);
}

function validateNoExternalCss(html, label) {
  const linkRegex = /<link\b[^>]*>/gi;
  const links = html.match(linkRegex) || [];
  const externalCssLinks = links.filter((tag) => {
    const relMatch = tag.match(/\brel\s*=\s*["']?([^"'\s>]+)/i);
    return relMatch && relMatch[1].toLowerCase() === "stylesheet";
  });

  if (externalCssLinks.length > 0) {
    fail(`${label} links external CSS`);
    return;
  }

  pass(`${label} has no external CSS links`);
}

function validateUnsupportedTags(html, label) {
  const found = UNSUPPORTED_TAGS.filter((tag) => new RegExp(`<\\s*${tag}\\b`, "i").test(html));

  if (found.length > 0) {
    fail(`${label} uses unsupported tags: ${found.join(", ")}`);
    return;
  }

  pass(`${label} avoids unsupported tags`);
}

function validateInlineStyles(html, label) {
  const styleAttrRegex = /\sstyle\s*=\s*(["'])(.*?)\1/gis;
  let match;
  const unsafeProperties = [];
  const unsafeValues = [];

  while ((match = styleAttrRegex.exec(html)) !== null) {
    const declarations = match[2].split(";");
    for (const declaration of declarations) {
      const trimmed = declaration.trim();
      if (!trimmed) {
        continue;
      }

      const separator = trimmed.indexOf(":");
      if (separator === -1) {
        unsafeValues.push(trimmed);
        continue;
      }

      const property = trimmed.slice(0, separator).trim().toLowerCase();
      const value = trimmed.slice(separator + 1).trim().toLowerCase();

      if (!SAFE_STYLE_PROPERTIES.has(property)) {
        unsafeProperties.push(property);
        continue;
      }

      if (property === "display" && !SAFE_DISPLAY_VALUES.has(value)) {
        unsafeValues.push(`${property}: ${value}`);
      }

      if (value.includes("url(") || value.includes("position:")) {
        unsafeValues.push(`${property}: ${value}`);
      }
    }
  }

  if (unsafeProperties.length > 0) {
    fail(`${label} uses unsupported inline style properties: ${[...new Set(unsafeProperties)].join(", ")}`);
    return;
  }

  if (unsafeValues.length > 0) {
    fail(`${label} uses unsupported inline style values: ${[...new Set(unsafeValues)].join(", ")}`);
    return;
  }

  pass(`${label} inline styles are within the safe set`);
}

function validateL1(widget) {
  const filePath = routeToFile(widget.url);
  if (!filePath) {
    return;
  }

  const label = widget.url;

  if (!fs.existsSync(filePath)) {
    fail(`${label} does not exist at ${path.relative(ROOT, filePath)}`);
    return;
  }

  pass(`${label} exists`);

  const html = stripComments(fs.readFileSync(filePath, "utf8"));
  validateNoScripts(html, label);
  validateNoExternalCss(html, label);
  validateUnsupportedTags(html, label);
  validateInlineStyles(html, label);
}

if (!fs.existsSync(MANIFEST_PATH)) {
  fail("manifest.json exists");
  process.exit(1);
}

pass("manifest.json exists");

const manifest = readJson(MANIFEST_PATH);

if (manifest) {
  if (!Array.isArray(manifest.widgets)) {
    fail("manifest.json has a widgets array");
  } else {
    pass("manifest.json has a widgets array");

    if (manifest.widgets.length > MAX_WIDGETS) {
      fail(`manifest.json has more than ${MAX_WIDGETS} widgets`);
    } else {
      pass(`manifest.json has ${MAX_WIDGETS} or fewer widgets`);
    }

    manifest.widgets.forEach((widget, index) => {
      const label = `widgets[${index}]`;

      if (!widget || typeof widget !== "object" || Array.isArray(widget)) {
        fail(`${label} is an object`);
        return;
      }

      if (typeof widget.name !== "string" || widget.name.trim() === "") {
        fail(`${label}.name is required`);
      } else {
        pass(`${label}.name is present`);
      }

      if (typeof widget.url !== "string" || widget.url.trim() === "") {
        fail(`${label}.url is required`);
        return;
      }

      pass(`${label}.url is present`);
      validateL1(widget);
    });
  }
}

if (failures > 0) {
  console.error(`\n${failures} validation failure(s).`);
  process.exit(1);
}

console.log("\nL1 validation passed.");
