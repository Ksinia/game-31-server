const express = require("express");
const db = require("./db");
const { router: loginRouter } = require("./auth/router");
const signupRouter = require("./user/router");
const bodyParser = require("body-parser");
const cors = require("cors");
const Sse = require("json-sse");
const roomRouterFactory = require("./room/router");

const port = process.env.PORT || 4000;
const app = express();
const bodyParserMiddleware = bodyParser.json();
const corsMiddleware = cors();
app.use(corsMiddleware);
app.use(bodyParserMiddleware);
app.use(loginRouter);
app.use(signupRouter);

const stream = new Sse();

const roomRouter = roomRouterFactory(stream);
app.use(roomRouter);

app.get("/", (req, res) => {
  stream.send("test");
  res.send("Hello"); //we need res.send to avoid timed out error
});

app.get("/stream", (req, res) => {
  stream.init(req, res);
});

app.listen(port, () => console.log(`Listening on port: ${port}`));
