-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ageGroup" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rounds" INTEGER NOT NULL DEFAULT 1,
    "season" TEXT,
    "academyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leagues_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "league_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "teamId" TEXT,
    "academyId" TEXT,
    "teamName" TEXT NOT NULL,
    "logoUrl" TEXT,
    CONSTRAINT "league_teams_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "league_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "league_teams_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "league_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "scheduledDate" DATETIME,
    "location" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "league_matches_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "league_matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "league_teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "league_matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "league_teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
