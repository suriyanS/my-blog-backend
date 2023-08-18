import express from "express";

const app = express();
app.use(express.json());

let articlesInfo = [
  {
    name: "learn-react",
    upvotes: 0,
    comments: [],
  },
  {
    name: "learn-node",
    upvotes: 0,
    comments: [],
  },
  {
    name: "mongodb",
    upvotes: 0,
    comments: [],
  },
];

app.put("/api/articles/:name/upvote", (req, res) => {
  const { name } = req.params;
  let article = articlesInfo.find((article) => article.name === name);
  if (article) {
    article.upvotes += 1;
    res.send(`The ${name} article now has ${article.upvotes} upvotes`);
  } else {
    res.send("That article doesn't exist");
  }
});

app.post("/api/articles/:name/comments", (req, res) => {
  const { name } = req.params;
  const { postedBy, comment } = req.body;
  let article = articlesInfo.find((article) => article.name === name);
  if (article) {
    article.comments.push({ postedBy, comment });
    res.send(`"${comment}" - ${postedBy} commented on ${name} article`);
  } else {
    res.send("That article doesn't exist");
  }
});

app.get("/api/articles/:name/comments", (req, res) => {
  const { name } = req.params;
  let article = articlesInfo.find((article) => article.name === name);
  if (article) {
    res.send(article.comments);
  } else {
    res.send("That article doesn't exist");
  }
});

app.listen(8000, () => {
  console.log("Server is listening on port 8000");
});
