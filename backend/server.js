require("./database");
const Room = require("./models/roomSchema");

const express = require("express");
const cors = require("cors");

const http = require("http");
const roomSchema = require("./models/roomSchema");
const socketServer = require("socket.io").Server;

const app = express();
const server = http.createServer(app);
const io = new socketServer(server, {
  cors: {
    origin: "*",
  },
});

//Middleware

app.use(cors());
app.use(express.json());

//Functions

function createRoom(id, password, admin) {
  const newRoom = new Room({
    id,
    password,
    admin,
    players: [admin],
  }).save();
}

//End points

app.post("/api/get_room", async (req, res) => {
  const data = req.body;

  try {
    const room = await Room.findOne({ id: data.id });
    res.json(room);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/get_rooms", async (req, res) => {
  try {
    const rooms = await Room.find();

    res.json({ rooms });
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/send_category", (req, res) => {
  const { category, roomId, player } = req.body;

  const newCategory = { category, origin: player, finished: false };

  Room.findOneAndUpdate(
    { id: roomId },
    { $push: { categories: newCategory } },
    { new: true }
  )
    .then((roomUpdated) => {
      if (roomUpdated.categories.length === roomUpdated.players.length) {
        res.json({ message: "all players send a category!" });
      } else {
        res.json({ message: "request received!" });
      }
    })
    .catch((err) => console.log(err));
});

// Socket.io

io.on("connection", (socket) => {
  console.log("client connected");

  socket.on("sd", () => {
    console.log(socket.rooms);
  });

  socket.on("createRoom", (data) => {
    socket.join(data.id);
    io.to(data.id).emit("join", data);

    createRoom(data.id, data.password, data.admin);

    console.log(`${data.admin} created a new room. id: ${data.id}`);
  });

  socket.on("joinRoom", async (data) => {
    const room = await Room.findOne({ id: data.id });

    if (room.password === data.password) {
      socket.join(data.id);

      room.players.push(data.player);
      await room.save();

      io.to(data.id).emit("roomUpdated", data.id);
      console.log(`${data.player} join game.`);
    }
  });

  socket.on("leaveRoom", async (data) => {
    socket.leave(data.id);

    let room = await Room.findOne({ id: data.id });

    if (room.admin === data.player) {
      await Room.deleteOne({ id: data.id });

      socket.to(data.id).emit("roomClosed");
    } else {
      await Room.updateOne(
        { id: data.id },
        { $pull: { players: data.player } }
      );

      io.to(data.id).emit("roomUpdated", data.id);
    }

    console.log(`${data.player} left game.`);
  });

  socket.on("gameStarted", (roomId) => {
    socket.to(roomId).emit("gameStarted");

    let timer = 5;

    const number = setInterval(() => {
      io.to(roomId).emit("timer", timer);
      timer--;

      if (timer == -1) {
        clearInterval(number);
      }
    }, 1000);
    console.log("Game started!");
  });

  socket.on("allCategoriesReady", async (roomId) => {
    try {
      const room = await Room.findOne({ id: roomId });

      room.currentCategory = room.categories[0].category;

      // if (room.turnOf) {
      //   console.log('if')

      //   const newTurn = room.players.indexOf(turnOf) + 1;

      //   const newTurnOf = room.players[newTurn];

      //   room.turnOf = newTurnOf;
      //   await room.save();

      //   //Timer
      //   let timer = 3;

      //   const number = setInterval(() => {
      //     io.to(roomId).emit("categoriesReadyTimer", { timer_: timer, roomId });
      //     timer--;

      //     if (timer == -1) {
      //       io.to(roomId).emit("allCategoriesReady", {
      //         roomId,
      //         initialPlayer: newTurnof,
      //       });
      //       clearInterval(number);
      //     }
      //   }, 1000);
      // } else {
      console.log("else");
      room.turnOf = room.players[0];
      room.save();

      //Timer
      let timer = 3;

      const number = setInterval(() => {
        io.to(roomId).emit("categoriesReadyTimer", {
          timer_: timer,
          roomId,
          turnOf: room.players[0],
        });
        timer--;

        if (timer == -1) {
          io.to(roomId).emit("allCategoriesReady", {
            roomId,
            initialPlayer: room.players[0],
          });
          clearInterval(number);
        }
      }, 1000);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("playerWriting", (data) => {
    io.to(data.roomId).emit("playerWriting", data.myResponse);
  });

  socket.on("letterSelected", async (data) => {
    await Room.findOneAndUpdate(
      { id: data.roomId },
      { $push: { lettersNotAvailable: data.letter } }
    );

    io.to(data.roomId).emit("letterSelected", data.letter);
  });

  socket.on("startWritingTimer", (data) => {
    //Error a solucionar: después del primer turno (luego de seleccionar categorias), el segundo cliente en la ronda llama dos veces a este listener
    const { roomId, player } = data;

    //Esto es para filtar errores, ya que a veces un cliente llama a este listener con player = undefined
    if(player === undefined) return;

    let timer = 9999;

    console.log("callTimer");
    console.log(data);

    const number = setInterval(() => {
      io.to(roomId).emit("writingTimer", {
        timer_: timer,
        roomId: roomId,
      });
      timer--;
      console.log(timer + ' _ ' + player);

      Room.findOne({id: roomId})
      .then(room => {
        if (timer == -1 || room.turnOf != player) {
          clearInterval(number);
        }
      })
    }, 1000);
  });

  socket.on("submitWord", async (data) => {
    console.log(
      `${data.response.origin} envio la palabra ${data.response.word} a la categoria ${data.response.category}`
    );

    const room = await Room.findOne({ id: data.roomId });

    // Enviar la respuesta al documento de la sala
    room.words.push(data.response);

    // Setear al jugador del siguiente turno, si no hay mas letras para la categoria, ir a la siguiente categoria
    const newTurn = room.players.indexOf(room.turnOf) + 1;
    const newTurnOf = room.players[newTurn];

    if (newTurnOf !== undefined) {
      room.turnOf = newTurnOf;
      io.to(data.roomId).emit("nextPlayer", newTurnOf);
    } else {
      room.turnOf = room.players[0];
      io.to(data.roomId).emit("nextPlayer", room.players[0]);
    }

    //Si no hay mas letras ir a la siguiente categoria
    if (room.lettersNotAvailable.length >= 26) {
      console.log('category finished!')
      room.categories.map((current) => {
        if (current.category === room.currentCategory) {
          current.finished = true;
          room.lettersNotAvailable = [];

          const nextCategoryIndex =
            room.categories.indexOf(room.currentCategory) + 1;

          room.currentCategory = room.categories[nextCategoryIndex];

          console.log('next category: ' + room.categories[nextCategoryIndex])
        }
      });
    }

    await room.save();

    io.to(data.roomId).emit("roomUpdated", data.roomId);
  });
});

server.listen(8000, () => {
  console.log(`server on port ${8000}...`);
});
