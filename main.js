require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const shortId = require("shortid");
const redis = require("redis");

app.use(express.json());

const redisClients = [
  redis.createClient({
    host: process.env.REDIS_HOST_1,
    port: process.env.REDIS_PORT_1,
  }),
  redis.createClient({
    host: process.env.REDIS_HOST_2,
    port: process.env.REDIS_PORT_2,
  }),
  redis.createClient({
    host: process.env.REDIS_HOST_3,
    port: process.env.REDIS_PORT_3,
  }),
];

function getRedisClient(key) {
  const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return redisClients[hash % redisClients.length];
}

app.post("shorten", async (req, res) => {
  const url = req.body.url;
  if (!url) return res.status(400).send("URL is required");
  const id = shortId.generate();
  const client = getRedisClient(id);

  await client.set(id, url);
  res.json({ shortUrl: `http://localhost:${process.env.PORT}/${shortId}` });
});

app.get("/:id", (req, res) => {
  const { shortId } = req.params;
  const redisClient = getRedisClient(shortId);
  
  redisClient.get(shortId, (err, reply) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error retrieving URL");
    } else if (!reply) {
      res.status(404).send("URL not found");
    } else {
      res.redirect(reply);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
