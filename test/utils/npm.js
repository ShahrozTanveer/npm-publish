"use strict";

const fs = require("fs");
const paths = require("./paths");

module.exports = {
  /**
   * Adds a stub behavior for our mock NPM binary
   */
  mock ({ args, cwd, env, stdout, stderr, exitCode }) {
    args = args || [];
    cwd = cwd || paths.workspace;
    env = env || {};
    stdout = stdout || "";
    stderr = stderr || "";
    exitCode = exitCode || 0;

    let mocks = readMocks();
    let stub = { args, cwd, env, stdout, stderr, exitCode };
    mocks.push(stub);
    fs.writeFileSync(paths.mocks, JSON.stringify(mocks));
  },

  /**
   * Returns the next stub behavior for the mock NPM binary
   *
   * @returns {{ args: string[], cwd: string, env: object, stdout: string, stderr: string, exitCode: number }}
   */
  stub () {
    let mocks = readMocks();
    let stub = mocks.find((mock) => !mock.ran);
    stub.ran = true;
    fs.writeFileSync(paths.mocks, JSON.stringify(mocks));
    return stub;
  },

  assert: {
    /**
     * Asserts that all mocks ran successfully.
     */
    ranSuccessfully () {
      let mocks = readMocks();
      for (let [index, stub] of mocks.entries()) {
        if (!stub.ran) {
          throw new Error(
            `NPM call #${index + 1} did not run:\n` +
            `EXPECTED: npm ${stub.args.join(" ")}\n` +
            "ACTUAL:   <not called>\n"
          );
        }
      }
    }
  },
};

/**
 * Returns the contents of the NPM mock config file
 *
 * @returns {object[]}
 */
function readMocks () {
  try {
    let json = fs.readFileSync(paths.mocks, "utf8");
    return JSON.parse(json);
  }
  catch (_) {
    return [];
  }
}
