const { Router } = require("express");
const Room = require("./model");
const authMiddleware = require("../auth/middleware");
const User = require("../user/model");

function factory(stream) {
  const router = new Router();

  router.post("/room", authMiddleware, async (req, res, next) => {
    const userId = req.user.id;
    try {
      const room = await Room.create(req.body);
      const oldRoomIdBlock = await User.findByPk(userId, {
        attributes: ["roomId"]
      });
      const oldRoomId = oldRoomIdBlock.dataValues.roomId;

      const oldRoom =
        null ||
        (await Room.findByPk(oldRoomId, {
          include: [
            {
              model: User,
              attributes: {
                exclude: ["password", "createdAt", "updatedAt", "roomId"]
              }
            }
          ]
        }));

      const user = await User.update(
        {
          roomId: room.dataValues.id
        },
        {
          where: { id: userId }
        }
      );

      const userData = await User.findByPk(userId, {
        attributes: ["id", "name"]
      });

      const action = {
        type: "NEW_ROOM",
        payload: { newRoom: { ...room.dataValues, users: [userData] }, oldRoom }
      };

      const string = JSON.stringify(action);

      stream.send(string);

      res.send(room);
    } catch (error) {
      next(error);
    }
  });

  router.put("/join", authMiddleware, async (req, res, next) => {
    // request should have userId,  newRoomId, named as such
    // works best if sending empty data as undefined, not sure what happens on null
    const userId = req.user.id;

    try {
      const oldRoomIdBlock = await User.findByPk(userId, {
        attributes: ["roomId"]
      });
      const oldRoomId = oldRoomIdBlock.dataValues.roomId;
      console.log("O L D R O O M", oldRoomId);
      let newRoomId = req.body.newRoomId;
      if (!newRoomId) {
        newRoomId = null;
      }

      const user = await User.update(
        {
          roomId: newRoomId
        },
        {
          where: { id: userId }
        }
      );

      const oldRoom =
        null ||
        (await Room.findByPk(oldRoomId, {
          include: [
            {
              model: User,
              attributes: {
                exclude: ["password", "createdAt", "updatedAt", "roomId"]
              }
            }
          ]
        }));

      const newRoom =
        null ||
        (await Room.findByPk(req.body.newRoomId, {
          include: [
            {
              model: User,
              attributes: {
                exclude: ["password", "createdAt", "updatedAt", "roomId"]
              }
            }
          ]
        }));
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
