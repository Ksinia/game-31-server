const { Router } = require("express");
const authMiddleware = require("../auth/middleware");
const Card = require("./model");
const User = require("../user/model");
const Room = require("../room/model");

function calculateScore(cards) {
  if (
    cards[0].cardObject.face === cards[1].cardObject.face &&
    cards[1].cardObject.face === cards[2].cardObject.face
  ) {
    return 30.5;
  } else {
    const scorePerSuit = cards.reduce(
      (acc, card) => {
        acc[card.cardObject.suit] += card.cardObject.value;
        return acc;
      },
      { S: 0, H: 0, C: 0, D: 0 }
    );
    score = Math.max(...Object.values(scorePerSuit));
    return score;
  }
}

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

// magic function, see test.js for tests

// function find_mode(arr) {
//   var max = 0;
//   var maxarr = [];
//   var counter = [];
//   var maxarr = [];

//   arr.forEach(function() {
//     counter.push(0);
//   });

//   for (var i = 0; i < arr.length; i++) {
//     for (var j = 0; j < arr.length; j++) {
//       if (arr[i] == arr[j]) counter[i]++;
//     }
//   }

//   max = arrayMax(counter);

//   for (var i = 0; i < arr.length; i++) {
//     if (counter[i] == max) maxarr.push(arr[i]);
//   }

//   var unique = maxarr.filter(onlyUnique);
//   return unique;
// }

// function arrayMax(arr) {
//   var len = arr.length,
//     max = -Infinity;
//   while (len--) {
//     if (arr[len] > max) {
//       max = arr[len];
//     }
//   }
//   return max;
// }

// function onlyUnique(value, index, self) {
//   return self.indexOf(value) === index;
// }

async function endgame(room) {
  const users = room.users;

  const scoreObject = users.reduce((acc, val, idx, arr) => {
    acc[val.id] = 0;
    return acc;
  }, {});

  const promises = users.map(async (user, idx, arr) => {
    const cards = await Card.findAll({
      where: { userId: user.id, roomId: room.id }
    });
    scoreObject[user.id] = calculateScore(cards);

    // if (
    //   cards[0].cardObject.face === cards[1].cardObject.face &&
    //   cards[1].cardObject.face === cards[2].cardObject.face
    // ) {
    //   scoreObject[user.id] = 30.5;
    // } else {
    //   const suits = cards.map(card => card.cardObject.suit);
    //   console.log(suits, "suits");
    //   const highSuit = find_mode(suits);
    //   console.log(highSuit);
    //   if (highSuit.length > 1) {
    //     console.log("highcard");
    //     // find highest value
    //     const values = cards.map(card => {
    //       console.log(card.cardObject.value, "value of cards");
    //       return card.cardObject.value;
    //     });
    //     const highestValue = Math.max(...values);
    //     console.log(highestValue, "highestValue, for:", user.id);
    //     scoreObject[user.id] = highestValue;
    //   } else {
    //     console.log("more cards");
    //     const score = cards.reduce((acc, val, idx, arr) => {
    //       console.log(acc, "acc before");
    //       console.log([val.cardObject.suit], highSuit, "same?");
    //       if (val.cardObject.suit === highSuit[0]) {
    //         console.log(val.cardObject.suit, "val");
    //         acc = acc + val.cardObject.value;
    //       }
    //       console.log(acc, "acc after");

    //       return acc;
    //     }, 0);
    //     console.log(score, "multiple cards, for:", user.id);

    //     scoreObject[user.id] = score;
    // }
    // }
  });
  const results = await Promise.all(promises);
  console.log(scoreObject);
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
        turn: room.users[0].id,
        passed: null
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

      // TODO : make separate function
      playerIds = room.users.map(user => {
        return user.id;
      });
      const turnOrder = playerIds.sort(function(a, b) {
        return a - b;
      });

      if (room.turn === userId && room.passed !== userId) {
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
        const shouldGameEnd = nextTurnId === room.passed;
        console.log("shouldGameEnd in the turn endpoint: ", shouldGameEnd);
        if (shouldGameEnd) {
          const someRoom = await room.update({ phase: "finished" });
          const scoreObject = await endgame(someRoom);

          const action = {
            type: "SCORE",
            payload: scoreObject
          };

          const string = JSON.stringify(action);
          stream.send(string);
        }
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
        const shouldGameEnd = nextTurnId === room.passed;
        console.log(shouldGameEnd);
        if (shouldGameEnd) {
          const someRoom = await room.update({ phase: "finished" });
          const scoreObject = await endgame(someRoom);
          console.log(scoreObject, "scoreObject");
          const action = {
            type: "SCORE",
            payload: scoreObject
          };

          const string = JSON.stringify(action);
          stream.send(string);
        }

        await room.update({ turn: nextTurnId });
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
