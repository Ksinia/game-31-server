const { Router } = require("express");
const authMiddleware = require("../auth/middleware");

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

      Card.destroy({
        where: { roomId: roomId }
      });

      //shuffle the deck
      const shuffled = shuffle(deck);

      const room = await room.findByPk(roomId, {
        include: [
          {
            model: User,
            attributes: {
              exclude: ["password", "createdAt", "updatedAt"]
            }
          }
        ]
      });

      const hands = [...room.users, { id: Null }];
      console.log(hands);

      await shuffled
        .slice(0, (room.maxPlayers + 1) * 3)
        .map((card, index, array) => {
          Card.create({
            cardObject: card,
            RoomId: room.id,
            UserId: hands[index % hands.length].id
          });
        });

      const updatedRoom = await room.update(
        {
          phase: "started"
        },
        {
          include: [
            {
              model: User,
              attributes: {
                exclude: ["password", "createdAt", "updatedAt"]
              }
            },
            { model: Card }
          ]
        }
      );

      const action = {
        type: "UPDATE_GAME",
        payload: updatedRoom
      };

      const string = JSON.stringify(action);

      stream.send(string);
      res.send(string);
    } catch (error) {
      next(error);
    }
  });
}
