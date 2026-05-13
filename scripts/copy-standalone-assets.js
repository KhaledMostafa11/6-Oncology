const fs = require("fs");
const path = require("path");

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");

function copyIfExists(source, destination) {
  if (!fs.existsSync(source)) return;

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
}

if (!fs.existsSync(standaloneDir)) {
  console.warn("Standalone output was not found. Skipping asset copy.");
  process.exit(0);
}

copyIfExists(
  path.join(root, ".next", "static"),
  path.join(standaloneDir, ".next", "static")
);

copyIfExists(path.join(root, "public"), path.join(standaloneDir, "public"));

console.log("Standalone static assets copied successfully.");
