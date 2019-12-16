const express = require("express");
const db = require("./db");
const { router: loginRouter } = require("./auth/router");
const signupRouter = require("./user/router");
const bodyParser = require("body-parser");
const cors = require("cors");

const port = process.env.PORT || 4000;
const app = express();
const bodyParserMiddleware = bodyParser.json();
const corsMiddleware = cors();
app.use(corsMiddleware);
app.use(bodyParserMiddleware);
app.use(loginRouter);
app.use(signupRouter);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(port, () => console.log(`Listening on port: ${port}`));
