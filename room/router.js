const { Router } = require("express");
const Room = require("./model");
const authMiddleware = require("../auth/middleware");
const User = require("../user/model");
const Card = require("../card/model");

function factory(stream) {
  const router = new Router();

  const switchRooms = async (user, newRoomId, next) => {
    try {
      const oldRoom = await Room.findByPk(user.roomId, {
        include: [
          {
            model: User,
            attributes: {
              exclude: ["password", "createdAt", "updatedAt", "roomId"]
            }
          },
          Card
        ]
      });
      oldRoom &&
        (await oldRoom.update({
          phase: "waiting"
        }));
      const oldRoomId = oldRoom ? oldRoom.id : null;

      await user.update({
        roomId: newRoomId
      });
      const newRoom = await Room.findByPk(newRoomId, {
        include: [
          {
            model: User,
            attributes: {
              exclude: ["password", "createdAt", "updatedAt", "roomId"]
            }
          },
          Card
        ]
      });
      if (newRoom && newRoom.users.length == newRoom.maxPlayers) {
        await newRoom.update({
          phase: "ready"
        });
      }

      const updatedOldRoom = await Room.findByPk(oldRoomId, {
        include: [
          {
            model: User,
            attributes: {
              exclude: ["password", "createdAt", "updatedAt", "roomId"]
            }
          },
          Card
        ]
      });
      const updatedNewRoom = await Room.findByPk(newRoomId, {
        include: [
          {
            model: User,
            attributes: {
              exclude: ["password", "createdAt", "updatedAt", "roomId"]
            }
          },
          Card
        ]
      });
      return {
        oldRoom: updatedOldRoom,
        newRoom: updatedNewRoom
      };
    } catch (error) {
      next(error);
    }
  };

  router.post("/room", authMiddleware, async (req, res, next) => {
    const user = req.user;
    try {
      const room = await Room.create(req.body);
      const newRoomId = room.id;
      const updatedRooms = await switchRooms(user, newRoomId, next);
      const action = {
        type: "NEW_ROOM",
        payload: updatedRooms
      };
      const string = JSON.stringify(action);
      stream.send(string);
      res.send(updatedRooms);
    } catch (error) {
      next(error);
    }
  });

  router.put("/join", authMiddleware, async (req, res, next) => {
    const user = req.user;
    const newRoomId = req.body.newRoomId;
    try {
      const updatedRooms = await switchRooms(user, newRoomId, next);
      const action = {
        type: "UPDATED_ROOMS",
        payload: updatedRooms
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
