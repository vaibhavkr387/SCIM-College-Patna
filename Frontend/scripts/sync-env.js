const fs = require("fs");
const path = require("path");

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[trimmed.slice(0, index).trim()] = value;
  }
  return out;
}

const root = path.join(__dirname, "..");
const envFile = fs.existsSync(path.join(root, ".env"))
  ? path.join(root, ".env")
  : path.join(root, ".env.example");

const env = parseEnv(fs.readFileSync(envFile, "utf8"));
const payload = {
  BACKEND_URL: env.BACKEND_URL || "http://localhost:5000",
  BACKEND_URL_ALT: env.BACKEND_URL_ALT || "",
};

const dest = path.join(root, "public", "js", "env.js");
fs.writeFileSync(
  dest,
  "window.SCIM_ENV = " + JSON.stringify(payload, null, 2) + ";\n",
);
console.log("Wrote frontend env to", dest);
