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

  router.put("/join", async (req, res, next) => {
    // request should have userId, oldRoomId and newRoomId, named as such
    // console.log(req.body.oldRoomId, "room id");
    // console.log(oldRoom, "O L D R O O M");
    try {
      const user = await User.update(
        {
          roomId: req.body.newRoomId
        },
        {
          where: { id: req.body.userId }
        }
      );

      console.log(req.body.oldRoomId, "old room id");

      const oldRoom =
        null ||
        (await Room.findByPk(req.body.oldRoomId, {
          include: [User]
        }));

      const newRoom = await Room.findByPk(req.body.newRoomId, {
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
        type: "UPDATED_ROOMS",
        payload: {
          oldRoom,
          newRoom
        }
      };
      const string = JSON.stringify(action);
      stream.send(string);
      res.send(string);
    } catch (error) {
      next(error);
    }
  });
  return router;
}
module.exports = factory;
