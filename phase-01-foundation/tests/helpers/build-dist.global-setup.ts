import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

const projectRoot = resolve(fileURLToPath(new URL("../../", import.meta.url)));

export default function buildDist(): void {
  const tscPath = join(projectRoot, "node_modules", "typescript", "bin", "tsc");
  const result = spawnSync(
    process.execPath,
    [tscPath, "-p", "tsconfig.build.json"],
    {
      cwd: projectRoot,
      encoding: "utf8",
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `CLI test setup: build of dist/ failed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
}
