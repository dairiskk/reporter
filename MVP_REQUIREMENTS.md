# Playwright Test Results Parser – MVP Requirements

## Tech Stack
- Next.js (App Router)
- SQLite + Prisma
- JWT auth (no roles)
- shadcn/ui components for UI

---

## Database Schema (Prisma)

```prisma
model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  reviews      Review[]
}

model Project {
  id        Int         @id @default(autoincrement())
  name      String
  results   TestResult[]
}

model TestResult {
  id          Int       @id @default(autoincrement())
  project     Project   @relation(fields: [projectId], references: [id])
  projectId   Int
  testName    String
  filePath    String
  projectName String
  status      String    // "passed" | "failed" | "skipped"
  timestamp   DateTime
  duration    Int?
  rawOutput   String?
  review      Review?
}

model Review {
  id           Int        @id @default(autoincrement())
  testResult   TestResult @relation(fields: [testResultId], references: [id])
  testResultId Int
  qa           User       @relation(fields: [qaId], references: [id])
  qaId         Int
  reason       ReviewReason
  comments     String?
  reviewedAt   DateTime   @default(now())
}

enum ReviewReason {
  ENV_ISSUE
  TEST_SCRIPT_ISSUE
  NEW_REQUIREMENT
  FLAKY_TEST
  DATA_ISSUE
  EXTERNAL_DEPENDENCY
  OTHER
}
```

---

## API Requirements

### Auth
- `POST /api/auth/login`
  - Input: `{ email, password }`
  - Output: `{ token }`

### Projects
- `GET /api/projects` → list all projects with failed count
- `POST /api/projects` → create project `{ name }`
- `DELETE /api/projects/:id` → delete project + cascade results/reviews

### Test Results
- `POST /api/projects/:id/results/upload`
  - Input: Playwright JSON
  - Parse and insert into DB (see parser spec below)
  - Output: `{ inserted: number }`

- `GET /api/projects/:id/results?status=all|failed|passed|skipped`
  - Output: array of results `{ id, testName, status, timestamp, reviewed }`

- `GET /api/results/:id`
  - Output: single test result with rawOutput

### Reviews
- `POST /api/results/:id/review`
  - Input: `{ reason: ReviewReason, comments: string }`
  - Output: `{ success: true }`

- `GET /api/results/:id/review`
  - Output: `{ id, reason, comments, reviewedAt }`

---

## Parsing Function Spec

```ts
// utils/parsePlaywrightJson.ts
import { Prisma } from "@prisma/client";

export type ParsedResult = Prisma.TestResultCreateManyInput;

export function parsePlaywrightJson(json: any, projectId: number): ParsedResult[] {
  const results: ParsedResult[] = [];

  function walkSuites(suites: any[], parentTitle = "") {
    for (const suite of suites || []) {
      const currentTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

      // Parse specs
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          for (const result of test.results || []) {
            results.push({
              projectId,
              testName: `${spec.title} ${test.title || ""}`.trim(),
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
```

---

## UI Requirements (Next.js + shadcn/ui)

### `/login`
- Email input (shadcn input)
- Password input
- Login button (shadcn button)

### `/projects`
- Table of projects (name, failed count)
- Add Project (dialog with input + button)
- Delete Project (row action)

### `/projects/[id]`
- Tabs: **All | Failed | Passed | Skipped**
- Table of test results:
  - Columns: Test Name, Status, Timestamp, Reviewed?
  - Row click → `/results/[id]`
- Upload Results button → `/projects/[id]/upload`

### `/projects/[id]/upload`
- File upload (shadcn input)
- Upload button
- Message after upload: “Inserted X results”

### `/results/[id]`
- Show details: Test Name, File Path, Status, Timestamp, Duration, Raw Output
- If failed & not reviewed:
  - Dropdown for reason (enum)
  - Textarea for comments
  - Submit button
- If reviewed:
  - Show reason, comments, reviewedAt (read-only)

---

## Rules
- JWT auth required for all API calls
- Cascade delete project → results → reviews
- Enum enforced for review reasons
- Minimal UI with shadcn/ui tables, forms, buttons
- Each Playwright `result` = one DB row
- Store `stdout` logs inside `rawOutput`
