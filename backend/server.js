require("./database");
const Room = require("./models/roomSchema");
const mongoose = require('mongoose');

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

function createRoom(id, password, admin, name) {
  const newRoom = new Room({
    id,
    name,
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

  socket.on("createRoom", (data) => {
    socket.join(data.id);
    io.to(data.id).emit("join", data);

    createRoom(data.id, data.password, data.admin, data.name);

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

  socket.on("gameStarted", async (roomId) => {
    await Room.findOneAndUpdate({id: roomId}, {inGame: true})
    io.to(roomId).emit("roomUpdated", roomId)
    
    
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

  socket.on("startWritingTimer", (data) => {
    //Error a solucionar: después del primer turno (luego de seleccionar categorias), el segundo cliente en la ronda llama dos veces a este listener
    const { roomId, player } = data;

    //Esto es para filtar errores, ya que a veces un cliente llama a este listener con player = undefined
    if (player === undefined) return;

    let timer = 9999;

    const number = setInterval(() => {
      io.to(roomId).emit("writingTimer", {
        timer_: timer,
        roomId: roomId,
      });
      timer--;

      Room.findOne({ id: roomId }).then((room) => {
        if (timer == -1 || room.turnOf != player) {
          clearInterval(number);
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

    let room = await Room.findOne({words: {$elemMatch: {_id: word._id}}})
    let currentWord = await room.words.find(current => current._id == word._id);
    
    if(!currentWord.likes.includes(player)) {
      currentWord.likes.push(player);
              
      if(currentWord.dislikes.includes(player)) {
        currentWord.dislikes = currentWord.dislikes.filter(current => current !== player);
      }
    }
    
    room.markModified('words'); // le decimos a mongoose que el campo words ha cambiado
    await room.save();
    
    socket.to(room.id).emit("approveAnswer", {origin: data.player, word: data.word})
  });

  socket.on("disapproveAnswer", async (data) => { 
    const { word, player } = data;   

    let room = await Room.findOne({words: {$elemMatch: {_id: word._id}}})
    let currentWord = await room.words.find(current => current._id == word._id);
    
    if(!currentWord.dislikes.includes(player)) {
      currentWord.dislikes.push(player);
              
      if(currentWord.likes.includes(player)) {
        currentWord.likes = currentWord.likes.filter(current => current !== player);
      }
    }
    
    room.markModified('words'); // le decimos a mongoose que el campo words ha cambiado
    await room.save(); 
    
    socket.to(room.id).emit("disapproveAnswer", {origin: data.player, word: data.word})
  });

});

server.listen(8000, () => {
  console.log(`server on port ${8000}...`);
});
