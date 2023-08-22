import express from "express";
import { connectToDb, db } from "./db.js";

const app = express();
app.use(express.json());

app.get("/api/articles/:name", async (req, res) => {
  const { name } = req.params;
  const article = await db.collection("articles").findOne({ name });
  if (article) {
    res.send(article);
  } else {
    res.sendStatus(404);
  }
});

app.put("/api/articles/:name/upvote", async (req, res) => {
  const { name } = req.params;
  await db.collection("articles").updateOne({ name }, { $inc: { upvotes: 1 } });
  const article = await db.collection("articles").findOne({ name });
  if (article) {
    res.send(article);
  } else {
    res.send("That article doesn't exist");
  }
});

app.post("/api/articles/:name/comments", async (req, res) => {
  const { name } = req.params;
  const { postedBy, comment } = req.body;
  await db
    .collection("articles")
    .updateOne({ name }, { $push: { comments: { postedBy, comment } } });
  const article = await db.collection("articles").findOne({ name });
  if (article) {
    res.send(article);
  } else {
    res.send("That article doesn't exist");
  }
});

async function startServer() {
  try {
    await connectToDb();
    console.log("Successfully connected to the database!");
    app.listen(8000, () => {
      console.log("Server is listening on port 8000");
    });
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

startServer();
