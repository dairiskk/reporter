
import { Prisma } from "@prisma/client";
export type ParsedResult = {
  projectId: number;
  testName: string;
  filePath: string;
  projectName: string;
  status: string;
  timestamp: Date;
  duration?: number;
  rawOutput?: string;
};

export function parsePlaywrightJson(json: any, projectId: number): ParsedResult[] {
  const results: ParsedResult[] = [];

  function walkSuites(suites: any[], parentTitle = "") {
    for (const suite of suites || []) {
      const currentTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

      // Parse specs
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          for (const result of test.results || []) {
            // Combine immediate parent suite title and spec title
            const testNameParts = [];
            if (suite.title) testNameParts.push(suite.title);
            if (spec.title) testNameParts.push(spec.title);
            if (test.title) testNameParts.push(test.title);
            results.push({
              projectId,
              testName: testNameParts.join(" ").trim(),
              filePath: spec.file || suite.file || "",
              projectName: test.projectName || "",
              status: result.status,
              timestamp: new Date(result.startTime),
              duration: result.duration,
              rawOutput: JSON.stringify(result.stdout?.map((s: any) => s.text) || []),
            });
          }
        }
      }

      // Recurse into nested suites
      if (suite.suites) walkSuites(suite.suites, currentTitle);
    }
  }

  walkSuites(json.suites);
  return results;
}
