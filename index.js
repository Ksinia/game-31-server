const express = require("express");
const db = require("./db");
const { router: loginRouter } = require("./auth/router");
const signupRouter = require("./user/router");
const cardRouterFactory = require("./card/router");
const bodyParser = require("body-parser");
const cors = require("cors");
const Sse = require("json-sse");
const roomRouterFactory = require("./room/router");
const Room = require("./room/model");
const port = process.env.PORT || 4000;
const app = express();
const bodyParserMiddleware = bodyParser.json();
const corsMiddleware = cors();
const User = require("./user/model");
app.use(corsMiddleware);
app.use(bodyParserMiddleware);
app.use(loginRouter);
app.use(signupRouter);

const stream = new Sse();

const cardRouter = cardRouterFactory(stream);
const roomRouter = roomRouterFactory(stream);

app.use(roomRouter);
app.use(cardRouter);

app.get("/", (req, res) => {
  stream.send("test");
  res.send("Hello"); //we need res.send to avoid timed out error
});

app.get("/stream", async (req, res, next) => {
  try {
    const rooms = await Room.findAll({
      include: [
        {
          model: User,
          attributes: {
            exclude: ["password", "createdAt", "updatedAt", "roomId"]
          }
        }
      ]
    });
    const action = {
      type: "ALL_ROOMS",
      payload: rooms
    };
    const string = JSON.stringify(action);
    stream.updateInit(string); //will send initial data to all clients
    stream.init(req, res);
  } catch (error) {
    next(error);
  }
});

app.listen(port, () => console.log(`Listening on port: ${port}`));
