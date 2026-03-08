-- AlterTable
ALTER TABLE "users" ADD COLUMN "mobile" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "dateOfBirth" DATETIME,
    "position" TEXT,
    "phone" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "teamId" TEXT,
    "academyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "players_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_players" ("academyId", "createdAt", "dateOfBirth", "guardianName", "guardianPhone", "id", "name", "phone", "photoUrl", "position", "subscriptionEnd", "teamId", "updatedAt", "userId") SELECT "academyId", "createdAt", "dateOfBirth", "guardianName", "guardianPhone", "id", "name", "phone", "photoUrl", "position", "subscriptionEnd", "teamId", "updatedAt", "userId" FROM "players";
DROP TABLE "players";
ALTER TABLE "new_players" RENAME TO "players";
CREATE UNIQUE INDEX "players_userId_key" ON "players"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
