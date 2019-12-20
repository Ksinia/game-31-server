const { Router } = require("express");
const authMiddleware = require("../auth/middleware");
const Card = require("./model");
const User = require("../user/model");
const Room = require("../room/model");

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

function endgame(room) {
  const users = room.users;

  const scoreObject = users.reduce((acc, val, idx, arr) => {
    acc[val] = 0;
    return acc;
  }, {});

  users.forEach(async (user, idx, arr) => {
    const cards = await Card.findAll({
      where: { userId: user.id }
    });
    if (
      cards[0].cardObject.face === cards[1].cardObject.face &&
      cards[1].cardObject.face === cards[2].cardObject.face
    ) {
      scoreObject[user.id] = 30.5;
    } else {
      const suits = cards.map(card => card.cardObject.suit);
      {
        // magic function, see test.js for tests

        function find_mode(arr) {
          var max = 0;
          var maxarr = [];
          var counter = [];
          var maxarr = [];

          arr.forEach(function() {
            counter.push(0);
          });

          for (var i = 0; i < arr.length; i++) {
            for (var j = 0; j < arr.length; j++) {
              if (arr[i] == arr[j]) counter[i]++;
            }
          }

          max = arrayMax(counter);

          for (var i = 0; i < arr.length; i++) {
            if (counter[i] == max) maxarr.push(arr[i]);
          }

          var unique = maxarr.filter(onlyUnique);
          return unique;
        }

        function arrayMax(arr) {
          var len = arr.length,
            max = -Infinity;
          while (len--) {
            if (arr[len] > max) {
              max = arr[len];
            }
          }
          return max;
        }

        function onlyUnique(value, index, self) {
          return self.indexOf(value) === index;
        }
        // end of magic function
      }
      const highSuit = find_mode(suits);
      if (highSuit.length === 3) {
        // find highest value
        const values = cards.map(card => card.cardObject.value);
        const highestValue = Math.max(...values);

        scoreObject[user.id] = highestValue;
      } else {
        const score = cards.reduce((acc, val, idx, arr) => {
          if (val.cardObject.suit === highSuit) {
            acc = acc + val.cardObject.value;
          }

          return acc;
        }, 0);

        scoreObject[user.id] = score;
      }
    }
  });
  return scoreObject;
}

function nextTurn(userId, turnOrder) {
  const currentTurnIndex = turnOrder.findIndex(id => {
    return id === userId;
  });
  const nextTurnId = turnOrder[(currentTurnIndex + 1) % turnOrder.length];
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
      console.log("room.passed: ", room.passed);
      console.log("userId: ", userId);
      if (room.turn === userId) {
        if (room.passed === userId) {
          // await Room.update({ phase: "finished" }, { where: { id: roomId } });
          const x = await room.update({ phase: "finished" });
          console.log(x);
          const scoreblock = endgame(room);
          const updatedRoom = await Room.findByPk(roomId, {
            include: [User, Card]
          });
          const action = {
            type: "UPDATE_GAME",
            payload: updatedRoom
          };

          const action2 = {
            type: "score",
            payload: scoreblock
          };

          stream.send(action);
          stream.send(action2);
        } else {
          playerIds = room.users.map(user => {
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
      if (room.turn !== userId) {
      } else {
        //just give the next turn
        playerIds = room.users.map(user => {
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
      }
    } catch (error) {
      nxt(error);
    }
  });

  return router;
}

module.exports = factory;
