-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_academies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "location" TEXT,
    "city" TEXT,
    "ageGroups" TEXT NOT NULL DEFAULT '[]',
    "banners" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_academies" ("ageGroups", "city", "createdAt", "id", "location", "logoUrl", "name", "updatedAt") SELECT "ageGroups", "city", "createdAt", "id", "location", "logoUrl", "name", "updatedAt" FROM "academies";
DROP TABLE "academies";
ALTER TABLE "new_academies" RENAME TO "academies";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
