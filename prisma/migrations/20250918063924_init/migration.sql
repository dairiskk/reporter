-- CreateEnum
CREATE TYPE "public"."ReviewReason" AS ENUM ('ENV_ISSUE', 'TEST_SCRIPT_ISSUE', 'NEW_REQUIREMENT', 'FLAKY_TEST', 'DATA_ISSUE', 'EXTERNAL_DEPENDENCY', 'BUG', 'OTHER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportFile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "ReportFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TestResult" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "reportFileId" INTEGER,
    "testName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "rawOutput" TEXT,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" SERIAL NOT NULL,
    "testResultId" INTEGER NOT NULL,
    "qaId" INTEGER NOT NULL,
    "reason" "public"."ReviewReason" NOT NULL,
    "comments" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Review_testResultId_key" ON "public"."Review"("testResultId");

-- AddForeignKey
ALTER TABLE "public"."ReportFile" ADD CONSTRAINT "ReportFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TestResult" ADD CONSTRAINT "TestResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TestResult" ADD CONSTRAINT "TestResult_reportFileId_fkey" FOREIGN KEY ("reportFileId") REFERENCES "public"."ReportFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "public"."TestResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_qaId_fkey" FOREIGN KEY ("qaId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
