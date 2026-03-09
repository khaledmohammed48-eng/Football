-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_player_attributes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "speed" INTEGER NOT NULL DEFAULT 5,
    "passing" INTEGER NOT NULL DEFAULT 5,
    "shooting" INTEGER NOT NULL DEFAULT 5,
    "dribbling" INTEGER NOT NULL DEFAULT 5,
    "defense" INTEGER NOT NULL DEFAULT 5,
    "stamina" INTEGER NOT NULL DEFAULT 5,
    "heading" INTEGER NOT NULL DEFAULT 5,
    "overall" INTEGER NOT NULL DEFAULT 5,
    "leftFoot" INTEGER NOT NULL DEFAULT 5,
    "rightFoot" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "player_attributes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_player_attributes" ("defense", "dribbling", "id", "passing", "playerId", "shooting", "speed", "stamina", "updatedAt") SELECT "defense", "dribbling", "id", "passing", "playerId", "shooting", "speed", "stamina", "updatedAt" FROM "player_attributes";
DROP TABLE "player_attributes";
ALTER TABLE "new_player_attributes" RENAME TO "player_attributes";
CREATE UNIQUE INDEX "player_attributes_playerId_key" ON "player_attributes"("playerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
