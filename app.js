const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (error) {
    console.log(`Data base error is ${error}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectPlayerTable = (objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
  };
};

//Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
    *
    FROM
    player_details;`;
  const getPlayersResponse = await db.all(getPlayersQuery);
  response.send(
    getPlayersResponse.map((eachPlayer) =>
      convertDbObjectPlayerTable(eachPlayer)
    )
  );
});

//Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `select * from player_details where player_id = ${playerId};`;
  const getPlayerResponse = await db.get(getPlayer);
  response.send(convertDbObjectPlayerTable(getPlayerResponse));
});

//Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
    update player_details set 
    player_name = '${playerName}';`;
  const updatePlayerResponse = await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match

const convertDbObjectMatchDetails = (objectItem) => {
  return {
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `select * from match_details where match_id = ${matchId};`;

  const getMatchQueryResponse = await db.get(getMatchQuery);
  response.send(convertDbObjectMatchDetails(getMatchQueryResponse));
});

//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `select match_id from player_match_score where player_id = ${playerId};`;
  const getPlayerQueryResponse = await db.get(getPlayerQuery);

  const getMatchesQuery = `select * from match_details where match_id = ${getPlayerQueryResponse.matchId};`;
  const getMatchesQueryResponse = await db.get(getMatchesQuery);
  response.send(
    getMatchesQueryResponse.map((eachPlayer) =>
      convertDbObjectMatchDetails(eachPlayer)
    )
  );
});

//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `select player_id from player_match_score where match_id = ${matchId};`;
  const getPMatchQueryResponse = await db.get(getMatchesQuery);

  const getPlayerQuery = `select * from player_details where player_id = ${getMatchQueryResponse.playerId};`;
  const getPlayerQueryResponse = await db.get(getPlayerQuery);
  response.send(
    getPlayerQueryResponse.map((eachPlayer) =>
      convertDbObjectPlayerTable(eachPlayer)
    )
  );
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `select player_id as playerId, player_name as playerName, sum(score) as totalScore, sum(fours) as totalFours, sum(sixes) as totalSixes, from player_match_score where player_id = ${playerId};`;

  const getQueryResponse = await db.get(getPlayerQuery);
  response.send(getQueryResponse);
});

module.exports = app;
