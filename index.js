const express = require("express");

const port = process.env.PORT || 4000;
const app = express();

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(port, () => console.log(`Listening on port: ${port}`));
