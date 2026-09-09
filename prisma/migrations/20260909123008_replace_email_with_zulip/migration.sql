/*
  Warnings:

  - You are about to drop the `EmailSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EmailSettings";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ZulipSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "siteUrl" TEXT NOT NULL DEFAULT '',
    "botEmail" TEXT NOT NULL DEFAULT '',
    "apiKey" TEXT NOT NULL DEFAULT '',
    "stream" TEXT NOT NULL DEFAULT '',
    "topic" TEXT NOT NULL DEFAULT 'Birthdays',
    "enabled" BOOLEAN NOT NULL DEFAULT false
);
