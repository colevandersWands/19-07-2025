/**
 * Testing Framework - Ported from SL1's describe-it.js
 * Lightweight Jest-like testing for educational use in the browser's console
 */

export const createTestingFramework = (targetWindow = window) => {
  let describeDepth = 0;
  let itDepth = 0;
  let beforeEachCallback = null;
  let currentReports = [];

  // Backup console for test output (bypass console blocking)
  const consoleBackup = { ...targetWindow.console };

  const renderIt = (report) => {
    const asyncReport = report.ms !== null;
    if (report.error) {
      consoleBackup.groupCollapsed(
        `%c✖ FAIL${asyncReport ? ` (${report.ms} ms)` : ""}: ${report.description}`,
        "font-weight: bold; color: red;"
      );
      for (const call of report.consoleCalls) {
        consoleBackup[call.method](...call.args);
      }
      if (report.error instanceof Error) {
        consoleBackup.error(`${report.error.name}: ${report.error.message}`);
      } else {
        consoleBackup.error(report.error);
      }
      consoleBackup.groupEnd();
    } else {
      if (report.consoleCalls.length === 0) {
        consoleBackup.log(
          `%c√ PASS${asyncReport ? ` (${report.ms} ms)` : ""}: ${report.description}`,
          "font-weight: bold; color: green;"
        );
      } else {
        consoleBackup.groupCollapsed(
          `%c√ PASS: ${report.description}`,
          "font-weight: bold; color: green;"
        );
        for (const call of report.consoleCalls) {
          consoleBackup[call.method](...call.args);
        }
        consoleBackup.groupEnd();
      }
    }
  };

  const renderDescribe = (report) => {
    consoleBackup.group(report.description);
    for (const child of report.children) {
      if (child.type === "it") {
        renderIt(child);
      } else {
        renderDescribe(child);
      }
    }
    if (report.error) {
      consoleBackup.error("%cSUITE ERROR:", "font-weight: bold;", report.error);
    }
    consoleBackup.groupEnd();
  };

  const resolveReport = async (report) => {
    const resolvedReport = await report;

    if (Array.isArray(resolvedReport.children)) {
      resolvedReport.children = await Promise.all(
        resolvedReport.children.map(resolveReport)
      );
    }

    return resolvedReport;
  };

  // Testing functions
  const beforeEach = (callback) => {
    if (typeof callback !== "function") {
      throw new TypeError("beforeEach argument is not a function");
    }
    beforeEachCallback = callback;
  };

  const describe = async (description, testFunction) => {
    if (typeof description !== "string") {
      throw new TypeError("first argument must be a string");
    }
    if (typeof testFunction !== "function") {
      throw new TypeError("second argument must be a function");
    }
    if (testFunction.constructor.name === "AsyncFunction") {
      throw new TypeError("second argument cannot be an async function");
    }

    describeDepth++;

    const parentReports = currentReports;

    const report = {
      type: "describe",
      description,
      testFunction,
      children: [],
      consoleCalls: [],
      error: null,
    };
    const reportPromise = Promise.resolve(report);
    parentReports.push(reportPromise);

    currentReports = report.children;

    try {
      testFunction();
    } catch (err) {
      report.error = err;
    }

    describeDepth--;

    if (describeDepth === 0) {
      resolveReport(report).then(renderDescribe);
    }

    currentReports = parentReports;
  };

  const it = async (description, testFunction) => {
    if (itDepth > 0) {
      throw new Error("cannot call `it` inside of an `it`");
    }
    if (typeof description !== "string") {
      throw new TypeError("first argument must be a string");
    }
    if (typeof testFunction !== "function") {
      throw new TypeError("second argument must be a function");
    }

    if (beforeEachCallback) {
      try {
        beforeEachCallback();
      } catch (err) {
        consoleBackup.error("%cbeforeEach Error:", "font-weight: bold;");
        throw err;
      }
    }

    itDepth++;

    const report = {
      type: "it",
      description,
      testFunction,
      consoleCalls: [],
      error: null,
      ms: null,
    };

    if (testFunction.constructor.name === "AsyncFunction") {
      const promiseReport = new Promise((res) => {
        const now = Date.now();
        testFunction()
          .then(() => {
            report.ms = Date.now() - now;
            res(report);
          })
          .catch((err) => {
            report.ms = Date.now() - now;
            report.error = err;
            res(report);
          });
      });

      // immediately log free-floating `it`s
      if (describeDepth === 0) {
        renderIt(await promiseReport);
      } else {
        currentReports.push(promiseReport);
      }
    } else {
      let returned;
      const now = Date.now();
      try {
        returned = testFunction();
      } catch (err) {
        report.error = err;
      }

      if (returned && typeof returned.then === "function") {
        currentReports.push(
          returned
            .then(() => {
              report.ms = Date.now() - now;
              return report;
            })
            .catch((err) => {
              report.ms = Date.now() - now;
              report.error = err;
              return report;
            })
        );
      }
      // immediately log free-floating `it`s
      else if (describeDepth === 0) {
        renderIt(report);
      } else {
        currentReports.push(Promise.resolve(report));
      }
    }

    itDepth--;
  };

  // Basic expectations (Jest-like matchers)
  const expect = (actual) => {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${actual} to be ${expected}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected ${actual} to be truthy`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected ${actual} to be falsy`);
        }
      },
      toThrow: () => {
        if (typeof actual !== 'function') {
          throw new Error('Expected a function');
        }
        let threw = false;
        try {
          actual();
        } catch (e) {
          threw = true;
        }
        if (!threw) {
          throw new Error('Expected function to throw');
        }
      }
    };
  };

  // Testing globals
  const globals = {
    describe,
    suite: describe,
    it,
    test: it,
    beforeEach,
    expect,
  };

  // Install globals in target window
  try {
    Object.assign(targetWindow, globals);
  } catch (_) {
    // Ignore errors if can't assign to window
  }

  return globals;
};