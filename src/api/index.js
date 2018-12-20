import Pusher from "pusher";
import _ from "lodash";
import { version } from "../../package.json";
import { Router } from "express";
import facets from "./facets";

var pusher = new Pusher({
  appId: "675152",
  key: "d61e39bd8719a7ff7ea6",
  secret: "c7bd136c6855fb3500b1",
  cluster: "eu",
  encrypted: true
});

let players = [];

const updatedPlayersByUsername = (players, username, value) => {
  return players.map(player => {
    if (player.username === username) {
      return { ...player, ...value };
    }
    return { ...player };
  });
};

export default ({ config, db }) => {
  let api = Router();

  // mount the facets resource
  api.use("/facets", facets({ config, db }));

  api.get("/", (req, res) => {
    res.json(players);
  });

  api.post("/join", (req, res) => {
    const username = req.body.username;

    const player = _.find(players, ["username", username]);

    if (player) {
      res.json({ version });
      return;
    }

    players.push({
      username,
      score: 0,
      order: 0
    });
    players = _.orderBy(players, ["username"], ["asc"]);
    pusher.trigger("buzzer-channel", "players-update", {
      message: players
    });
    res.json({ version });
  });

  api.post("/buzz", (req, res) => {
    const username = req.body.username;

    const player = _.find(players, ["username", username]);
    if (player.order !== 0) {
      res.json({ version });
      return;
    }

    const lastPlayer = _.maxBy(players, "order");

    players = updatedPlayersByUsername(players, username, {
      order: lastPlayer.order + 1
    });
    pusher.trigger("buzzer-channel", "players-update", {
      message: players
    });
    res.json({ version });
  });

  api.post("/correct", (req, res) => {
    const username = req.body.username;
    const lastPlayer = _.maxBy(players, "order");

    players = _.map(players, player => {
      if (player.order === 1) {
        return { ...player, order: 0, score: player.score + 1 };
      }
      return { ...player, order: 0 };
    });
    pusher.trigger("buzzer-channel", "players-update", {
      message: players
    });
    pusher.trigger("buzzer-channel", "next-question", {});
    res.json({ version });
  });

  api.post("/incorrect", (req, res) => {
    const username = req.body.username;

    const lastPlayer = _.maxBy(players, "order");

    players = _.map(players, player => {
      if (player.order === 1) {
        return { ...player, order: -1 };
      }

      if (player.order > 1) {
        return { ...player, order: player.order - 1 };
      }

      return player;
    });

    pusher.trigger("buzzer-channel", "players-update", {
      message: players
    });
    res.json({ version });
  });

  api.post("/reset", (req, res) => {
    players = [];

    pusher.trigger("buzzer-channel", "players-update", {
      message: players
    });
    pusher.trigger("buzzer-channel", "next-question", {});
    res.json({ version });
  });

  return api;
};
