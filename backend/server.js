require("./database");
const Room = require("./models/roomSchema");
const mongoose = require("mongoose");
const premadeCategories = require("./categories.json").categories;

const express = require("express");
const cors = require("cors");

const http = require("http");
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

async function createRoom(id, password, admin, name) {
  let unorderedCategories = premadeCategories;
  unorderedCategories = unorderedCategories.sort(() => Math.random() - 0.5);

  const newRoom = await new Room({
    id,
    name,
    password,
    admin,
    players: [admin],
    playersVotes: [{ name: admin, votes: 0 }],
    premadeCategories: unorderedCategories,
  }).save();

  return true;
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

  socket.on("createRoom", async (data) => {
    await socket.join(data.id);

    await createRoom(data.id, data.password, data.admin, data.name);
  });

  socket.on("joinRoom", async (data) => {
    const room = await Room.findOne({ id: data.id });

    if (room.password === data.password) {
      if(!room.players.includes(data.player)) {
        socket.join(data.id);

        room.players.push(data.player);
        room.playersVotes.push({ name: data.player, votes: 0 });
  
        await room.save();
        io.to(data.id).emit("roomUpdated", data.id);
      } else {
        io.to(socket.id).emit("accessDenied", "duplicate nickname")
      }
    } else {
      io.to(socket.id).emit("accessDenied", "incorrect password")
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

  socket.on("gameStarted", async (roomId) => {
    await Room.findOneAndUpdate({ id: roomId }, { inGame: true });
    io.to(roomId).emit("roomUpdated", roomId);

    ////////

    const room = await Room.findOne({ id: roomId });

    var premadeCategoriesLots = [];
    var counter = 0;

    for (var i = 0; i < room.players.length; i++) {
      var player = room.players[i];
      var assignedCategories = [];

      for (
        var j = counter;
        j < counter + 6 && j < room.premadeCategories.length;
        j++
      ) {
        assignedCategories.push(room.premadeCategories[j]);
      }

      premadeCategoriesLots.push({
        player: player,
        categories: assignedCategories,
      });
      counter += 6;
    }

    io.to(roomId).emit("categoriesLots", premadeCategoriesLots);

    ////////

    let timer = 5;

    const number = setInterval(() => {
      io.to(roomId).emit("timer", timer);
      timer--;

      if (timer == -1) {
        clearInterval(number);
      }
    }, 1000);
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
    // await Room.findOneAndUpdate(
    //   { id: data.roomId },
    //   { $push: { lettersNotAvailable: data.letter } }
    // );

    io.to(data.roomId).emit("letterSelected", data.letter);
  });

  socket.on("startWritingTimer", async (data) => {
    console.log("start writing timer...")

    //Error a solucionar: después del primer turno (luego de seleccionar categorias), el segundo cliente en la ronda llama dos veces a este listener
    const { roomId, player } = data;

    //Esto es para filtar errores, ya que a veces un cliente llama a este listener con player = undefined
    if (player === undefined) return;

    const room_ = await Room.findOne({ id: roomId });
    let timer = room_.settings.roundTime;

    let intervalRef = setInterval(() => {
      Room.findOne({ id: roomId }).then((room) => {
        if ((room && room.turnOf != player) || !room || timer == -1) {
          clearInterval(intervalRef);
        } else if (timer > -1 && room && room.turnOf == player) {
          io.to(roomId).emit("writingTimer", {
            timer_: timer,
            roomId: roomId,
            player: player,
            turnOf: room_.turnOf,
            category: room_.currentCategory,
            syncTurnOf: room.turnOf,
            syncCategory: room.currentCategory 
          });
          timer--;
        }
      });
    }, 1000);
  });

  socket.on("submitWord", async (data) => {
    io.to(data.roomId).emit("letterUsed", data.response.letter);

    const room = await Room.findOne({ id: data.roomId });

    // Enviar la respuesta al documento de la sala
    room.words.push(data.response);

    room.lettersNotAvailable.push(data.response.letter);

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
    await room.save();

    //Si no hay mas letras ir a la siguiente categoria (26 son todas las letras del abecedario sin contar la ñ)
    if (room.lettersNotAvailable.length >= 4) {
      io.to(data.roomId).emit("categoryFinished");

      let currentCateogryIndex = room.categories.findIndex(
        (obj) => obj.category === room.currentCategory
      );
      room.categories[currentCateogryIndex].finished = true;

      room.lettersNotAvailable = [];

      //Si hay mas categorias ir a la siguiente, sino finalizar juego
      if (room.categories[currentCateogryIndex + 1] == undefined) {
        io.to(room.id).emit("gameFinished", {
          words: room.words,
          categories: room.categories,
        });
      } else {
        room.currentCategory =
          room.categories[currentCateogryIndex + 1].category;

        await room.save();
      }
    }
    io.to(data.roomId).emit("roomUpdated", data.roomId);
  });

  // socket.on("approveAnswer", async (data) => {

  //   Room.findOneAndUpdate({words: {$elemMatch: {_id: data.word._id}}}, {$push: {"words.$[elem].likes": data.player}}, {arrayFilters: [{"elem._id": data.word._id}]})
  //   .then((room) => {
  //     socket.to(room.id).emit("approveAnswer", {origin: data.player, word: data.word})
  //   })
  //   .catch(err => console.log(err))
  // });

  socket.on("approveAnswer", async (data) => {
    const { word, player } = data;

    let room = await Room.findOne({ words: { $elemMatch: { _id: word._id } } });
    let currentWord = await room.words.find(
      (current) => current._id == word._id
    );

    if (!currentWord.likes.includes(player)) {
      currentWord.likes.push(player);

      let playerVotes = room.playersVotes.find(
        (current) => current.name === word.origin
      );
      playerVotes.votes++;

      if (currentWord.dislikes.includes(player)) {
        //Esto se hace para evitar que un voto sea anulado cuando le damos like y luego dislike o viceversa.
        playerVotes.votes++;

        currentWord.dislikes = currentWord.dislikes.filter(
          (current) => current !== player
        );
      }
    }

    //room.markModified('words'); // le decimos a mongoose que el campo words ha cambiado
    await room.save();

    socket
      .to(room.id)
      .emit("approveAnswer", { origin: data.player, word: data.word });
  });

  socket.on("disapproveAnswer", async (data) => {
    const { word, player } = data;

    let room = await Room.findOne({ words: { $elemMatch: { _id: word._id } } });
    let currentWord = await room.words.find(
      (current) => current._id == word._id
    );

    if (!currentWord.dislikes.includes(player)) {
      currentWord.dislikes.push(player);

      let playerVotes = room.playersVotes.find(
        (current) => current.name === word.origin
      );
      playerVotes.votes--;

      if (currentWord.likes.includes(player)) {
        //Esto se hace para evitar que un voto sea anulado cuando le damos like y luego dislike o viceversa.
        playerVotes.votes--;

        currentWord.likes = currentWord.likes.filter(
          (current) => current !== player
        );
      }
    }

    //room.markModified('words'); // le decimos a mongoose que el campo words ha cambiado
    await room.save();

    socket
      .to(room.id)
      .emit("disapproveAnswer", { origin: data.player, word: data.word });
  });

  socket.on("readyPlayer", async (data) => {
    const { word, player } = data;

    let room = await Room.findOne({ words: { $elemMatch: { _id: word._id } } });

    io.to(room.id).emit("readyPlayer", player);
  });

  socket.on("showWinner", async (data) => {
    const { word } = data;

    let room = await Room.findOne({ words: { $elemMatch: { _id: word._id } } });

    io.to(room.id).emit("showWinner", room.playersVotes);
  });

  socket.on("endGame", async (roomId) => {
    let room = await Room.findOne({ id: roomId });

    room.turnOf = "";
    room.categories = [];
    room.words = [];
    room.inGame = false;
    room.lettersNotAvailable = [];
    room.currentCategory = "";
    room.playersVotes = room.playersVotes.map((current) => {
      current.votes = 0;
      return current;
    });

    await room.save();

    io.to(roomId).emit("endGame", roomId);
  });

  socket.on("message", (data) => {
    const { roomId, message } = data;

    io.to(roomId).emit("message", message);
  });

  socket.on("changeRoundTime", async (data) => {
    const { roomId, roundTime } = data;

    const room = await Room.findOne({ id: roomId });
    room.settings.roundTime = roundTime;
    await room.save();

    socket.to(roomId).emit("roomUpdated", roomId);
  });
});

server.listen(8000, () => {
  console.log(`server on port ${8000}...`);
});
