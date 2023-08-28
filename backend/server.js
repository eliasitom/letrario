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
    players: [admin, ],
  }).save();
}

//End points

app.post("/get_room", async (req, res) => {
  const data = req.body;

  try {
    const room = await Room.findOne({ id: data.id });
    res.json(room);
  } catch (error) {
    console.log(error);
  }
});

// Socket.io

io.on("connection", (socket) => {
  console.log("client connected");

  socket.on("sd", ()=> {
    console.log(socket.rooms)
  })

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
      
      await Room.updateOne({ id: data.id }, { $pull: { players: data.player } })

      io.to(data.id).emit("roomUpdated", data.id);
    }

    console.log(`${data.player} left game.`);
  });

  socket.on("gameStarted", (roomId) => {
    socket.to(roomId).emit("gameStarted");
    console.log('Game started!')
  })
});

server.listen(8000, () => {
  console.log(`server on port ${8000}...`);
});
