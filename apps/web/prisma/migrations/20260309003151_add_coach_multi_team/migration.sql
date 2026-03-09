-- CreateTable
CREATE TABLE "coach_teams" (
    "coachId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    PRIMARY KEY ("coachId", "teamId"),
    CONSTRAINT "coach_teams_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "coach_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
