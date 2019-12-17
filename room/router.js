const { Router } = require("express");
const Room = require("./model");
const authMiddleware = require("../auth/middleware");
const User = require("../user/model");

function factory(stream) {
  const router = new Router();

  router.post("/room", authMiddleware, async (req, res, next) => {
    const userId = req.user.id;
    try {
      const room = await Room.create({ ...req.body, userId: userId });

      const action = {
        type: "NEW_ROOM",
        payload: { ...room.dataValues, owner: req.user.name }
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
