const { Router } = require("express");
const authMiddleware = require("../auth/middleware");
const Card = require("./model");
const User = require("../user/model");

const deck = [
  { face: "7", suit: "S", value: 7 },
  { face: "8", suit: "S", value: 8 },
  { face: "9", suit: "S", value: 9 },
  { face: "10", suit: "S", value: 10 },
  { face: "J", suit: "S", value: 10 },
  { face: "Q", suit: "S", value: 10 },
  { face: "K", suit: "S", value: 10 },
  { face: "A", suit: "S", value: 11 },
  { face: "7", suit: "C", value: 7 },
  { face: "8", suit: "C", value: 8 },
  { face: "9", suit: "C", value: 9 },
  { face: "10", suit: "C", value: 10 },
  { face: "J", suit: "C", value: 10 },
  { face: "Q", suit: "C", value: 10 },
  { face: "K", suit: "C", value: 10 },
  { face: "A", suit: "C", value: 11 },
  { face: "7", suit: "H", value: 7 },
  { face: "8", suit: "H", value: 8 },
  { face: "9", suit: "H", value: 9 },
  { face: "10", suit: "H", value: 10 },
  { face: "J", suit: "H", value: 10 },
  { face: "Q", suit: "H", value: 10 },
  { face: "K", suit: "H", value: 10 },
  { face: "A", suit: "H", value: 11 },
  { face: "7", suit: "D", value: 7 },
  { face: "8", suit: "D", value: 8 },
  { face: "9", suit: "D", value: 9 },
  { face: "10", suit: "D", value: 10 },
  { face: "J", suit: "D", value: 10 },
  { face: "Q", suit: "D", value: 10 },
  { face: "K", suit: "D", value: 10 },
  { face: "A", suit: "D", value: 11 }
];

function endgame() {}

function nextTurn(userId, turnOrder) {
  const currentTurnIndex = turnOrder.findIndex(id => {
    return id === userId;
  });
  const nextTurnId = turnOrder[currentTurnIndex + (1 % turnOrder.length)];
  return nextTurnId;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

console.log(shuffle(deck));

function factory(stream) {
  const router = new Router();

  router.put("/start", authMiddleware, async (req, res, nxt) => {
    try {
      // delete all cards that belong to this room
      //delete all cards that belong to users in this room
      roomId = req.body.roomId;
      console.log("roomId", roomId);

      Card.destroy({
        where: { roomId: roomId }
      });

      //shuffle the deck
      const shuffled = shuffle(deck);

      const room = await Room.findByPk(roomId, {
        include: [
          {
            model: User,
            attributes: {
              exclude: ["password", "createdAt", "updatedAt"]
            }
          }
        ]
      });

      const hands = [...room.users, { id: null }];
      console.log(hands);

      await Promise.all(
        shuffled
          .slice(0, (room.maxPlayers + 1) * 3)
          .map(async (card, index, array) => {
            await Card.create({
              cardObject: card,
              roomId: room.id,
              userId: hands[index % hands.length].id
            });
          })
      );

      await room.update({
        phase: "started",
        turn: room.users[0].id
      });
      const updatedRoom = await Room.findByPk(roomId, {
        include: [User, Card]
      });

      const action = {
        type: "UPDATE_GAME",
        payload: updatedRoom
      };

      const string = JSON.stringify(action);

      stream.send(string);
      res.send(string);
    } catch (error) {
      nxt(error);
    }
  });

  router.put("/turn", authMiddleware, async (req, res, nxt) => {
    const roomId = req.body.roomId;
    const discardId = req.body.discard;
    const pickId = req.body.pick;
    const userId = req.user.id;

    try {
      //set turn order
      const room = await Room.findByPk(roomId, {
        include: [
          {
            model: User,
            attributes: {
              exclude: ["password", "createdAt", "updatedAt"]
            }
          }
        ]
      });

      if (room.passed === userId) {
        endgame();
      } else {
        console.log("room", room);

        playerIds = room.Users.map(user => {
          return user.id;
        });
        const turnOrder = playerIds.sort(function(a, b) {
          return a - b;
        });

        // check if a turn was passed, and if that is this players turn
        //update cards
        await Card.update(
          { userId: userId },
          {
            where: { id: pickId, roomId: roomId }
          }
        );
        await Card.update(
          { userId: null },
          {
            where: { id: discardId, roomId: roomId }
          }
        );

        // update turn
        const nextTurnId = nextTurn(userId, turnOrder);
        await Room.update({ turn: nextTurnId }, { where: { id: roomId } });
        //send entire Room to stream
        const updatedRoom = await Room.findByPk(roomId, {
          include: [User, Card]
        });

        const action = {
          type: "UPDATE_GAME",
          payload: updatedRoom
        };

        const string = JSON.stringify(action);

        stream.send(string);
        res.send(string);
      }
    } catch (error) {
      nxt(error);
    }
  });

  router.put("/pass", authMiddleware, async (req, res, nxt) => {
    const roomId = req.body.roomId;
    const userId = req.user.id;
    try {
      const room = await Room.findByPk(roomId, {
        include: [
          {
            model: User,
            attributes: {
              exclude: ["password", "createdAt", "updatedAt"]
            }
          }
        ]
      });

      //just give the next turn
      playerIds = room.Users.map(user => {
        return user.id;
      });
      const turnOrder = playerIds.sort(function(a, b) {
        return a - b;
      });
      const nextTurnId = nextTurn(userId, turnOrder);
      await Room.update({ turn: nextTurnId }, { where: { id: roomId } });
      //send entire Room to stream
      const updatedRoom = await Room.findByPk(roomId, {
        include: [User, Card]
      });

      if (room.passed) {
        const action = {
          type: "UPDATE_GAME",
          payload: updatedRoom
        };

        const string = JSON.stringify(action);

        stream.send(string);
        res.send(string);
      } else {
        //set passed to userId
        await Room.update({ passed: userId }, { where: { id: roomId } });
        const updatedRoom2 = await Room.findByPk(roomId, {
          include: [User, Card]
        });
        const action = {
          type: "UPDATE_GAME",
          payload: updatedRoom2
        };

        const string = JSON.stringify(action);

        stream.send(string);
        res.send(string);
      }
    } catch (error) {
      nxt(error);
    }
  });

  return router;
}

module.exports = factory;
