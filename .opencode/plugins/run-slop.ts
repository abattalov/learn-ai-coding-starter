import { execFile } from "node:child_process"
import path from "node:path"
import { promisify } from "node:util"

import { Plugin } from "@opencode/plugin"

const execFileAsync = promisify(execFile)

export default Plugin.define({
  id: "sloperator.run-slop",
  setup: async (ctx) => {
    // Run every program from the project root so `uv` resolves the same
    // environment regardless of the session's working directory.
    const directory = ctx.location.directory

    await ctx.tool.transform((tools) => {
      tools.add({
        name: "run_slop",
        description: "Run a SlopLang (.slop) program with sloperator",
        input: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the .slop file, relative to the project root or absolute",
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
        options: { codemode: false },
        execute: async (input) => {
          const { path: file } = input as { path: string }
          const program = path.isAbsolute(file) ? file : path.join(directory, file)

          try {
            const { stdout, stderr } = await execFileAsync(
              "uv",
              ["run", "--no-active", "sloperator.py", program],
              { cwd: directory },
            )
            return { content: JSON.stringify({ stdout, stderr, exitCode: 0 }) }
          } catch (error) {
            const failure = error as { stdout?: string; stderr?: string; code?: number }
            return {
              content: JSON.stringify({
                stdout: failure.stdout ?? "",
                stderr: failure.stderr ?? "",
                exitCode: typeof failure.code === "number" ? failure.code : 1,
              }),
            }
          }
        },
      })
    })
  },
})
