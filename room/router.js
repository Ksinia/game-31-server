const { Router } = require("express");
const Room = require("./model");

function factory(stream) {
  const router = new Router();

  router.post("/room", async (req, res, next) => {
    try {
      const room = await Room.create(req.body);

      const action = {
        type: "NEW_ROOM",
        payload: room
      };

      const string = JSON.stringify(action);

      stream.send(string);

      res.send(room);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
module.exports = factory;
