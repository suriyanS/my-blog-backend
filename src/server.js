import fs from "fs";
import admin from "firebase-admin";
import express from "express";
import "dotenv/config";
import { connectToDb, db } from "./db.js";

import { fileURLToPath } from "url";
import path from "path";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);

const credentials = JSON.parse(fs.readFileSync("./credentials.json"));
admin.initializeApp({
  credential: admin.credential.cert(credentials),
});
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirName, "../build")));
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, "../build/index.html"));
});

app.use(async (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith("Bearer ")) {
    const authToken = authorization.split(" ")[1];
    try {
      req.user = await admin.auth().verifyIdToken(authToken);
    } catch (e) {
      console.error("Error verifying token:", e);
      return res.sendStatus(400);
    }
  } else if (!req.user) {
    req.user = {};
  }
  next();
});

app.get("/api/auth/verify", async (req, res) => {
  const authToken = req.headers.authorization?.replace("Bearer ", "");
  if (!authToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(authToken);
    req.user = decodedToken;
    return res.status(200).json({ message: "Authentication successful" });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
});

app.get("/api/articles/:name", async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;
  const article = await db.collection("articles").findOne({ name });
  if (article) {
    const upvoteIds = article.upvoteIds || [];
    article.canUpvote =
      uid && (!upvoteIds || upvoteIds.length === 0 || !upvoteIds.includes(uid));
    res.send(article);
  } else {
    res.sendStatus(404);
  }
});

app.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
});

app.put("/api/articles/:name/upvote", async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;
  const article = await db.collection("articles").findOne({ name });
  if (article) {
    const upvoteIds = article.upvoteIds || [];
    const canUpvote =
      uid && (!upvoteIds || upvoteIds.length === 0 || !upvoteIds.includes(uid));
    if (canUpvote) {
      await db
        .collection("articles")
        .updateOne(
          { name },
          { $inc: { upvotes: 1 } },
          { $push: { upvoteIds: uid } }
        );
    }
    const updatedArticle = await db.collection("articles").findOne({ name });
    res.send(updatedArticle);
  } else {
    res.send("That article doesn't exist");
  }
});

app.post("/api/articles/:name/comments", async (req, res) => {
  const { name } = req.params;
  const { comment, postedBy } = req.body;
  await db
    .collection("articles")
    .updateOne(
      { name },
      { $push: { comments: { postedBy: postedBy, comment } } }
    );
  const article = await db.collection("articles").findOne({ name });
  if (article) {
    res.send(article);
  } else {
    res.send("That article doesn't exist");
  }
});

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await connectToDb();
    console.log("Successfully connected to the database!");
    app.listen(8000, () => {
      console.log("Server is listening on port " + PORT);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

startServer();
