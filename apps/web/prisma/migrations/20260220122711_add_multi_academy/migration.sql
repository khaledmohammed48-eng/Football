-- CreateTable
CREATE TABLE "academies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "location" TEXT,
    "city" TEXT,
    "ageGroups" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "match_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromAcademyId" TEXT NOT NULL,
    "toAcademyId" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "proposedDate" DATETIME NOT NULL,
    "location" TEXT,
    "homeOrAway" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "match_requests_fromAcademyId_fkey" FOREIGN KEY ("fromAcademyId") REFERENCES "academies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "match_requests_toAcademyId_fkey" FOREIGN KEY ("toAcademyId") REFERENCES "academies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_coaches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "phone" TEXT,
    "teamId" TEXT,
    "academyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "coaches_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "coaches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "coaches_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_coaches" ("createdAt", "id", "name", "phone", "photoUrl", "teamId", "updatedAt", "userId") SELECT "createdAt", "id", "name", "phone", "photoUrl", "teamId", "updatedAt", "userId" FROM "coaches";
DROP TABLE "coaches";
ALTER TABLE "new_coaches" RENAME TO "coaches";
CREATE UNIQUE INDEX "coaches_userId_key" ON "coaches"("userId");
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
    "subscriptionEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "players_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_players" ("createdAt", "dateOfBirth", "guardianName", "guardianPhone", "id", "name", "phone", "photoUrl", "position", "subscriptionEnd", "teamId", "updatedAt", "userId") SELECT "createdAt", "dateOfBirth", "guardianName", "guardianPhone", "id", "name", "phone", "photoUrl", "position", "subscriptionEnd", "teamId", "updatedAt", "userId" FROM "players";
DROP TABLE "players";
ALTER TABLE "new_players" RENAME TO "players";
CREATE UNIQUE INDEX "players_userId_key" ON "players"("userId");
CREATE TABLE "new_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "academyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teams_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_teams" ("createdAt", "description", "id", "logoUrl", "name", "updatedAt") SELECT "createdAt", "description", "id", "logoUrl", "name", "updatedAt" FROM "teams";
DROP TABLE "teams";
ALTER TABLE "new_teams" RENAME TO "teams";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "academyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "users_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "createdById", "email", "id", "password", "role", "updatedAt") SELECT "createdAt", "createdById", "email", "id", "password", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
