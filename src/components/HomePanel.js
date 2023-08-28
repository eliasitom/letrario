import "../stylesheets/HomePanel.css";

import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";

import io from "socket.io-client";
const socket = io("http://localhost:8000");

const HomePanel = () => {
  const [nickname, setNickname] = useState("");

  const [hostPassword, setHostPassword] = useState("");

  const [guestId, setGuestId] = useState("");
  const [guestPassword, setGuestPassword] = useState("");

  const [roomData, setRoomData] = useState(null);

  const createRoom = (e) => {
    e.preventDefault();

    const data = {
      id: uuidv4(),
      admin: nickname,
      password: hostPassword,
      players: [nickname],
      lettersNotAvailable: [],
      answers: [],
    };

    socket.emit("createRoom", data);

    setRoomData(data);
  };

  const joinRoom = (e) => {
    e.preventDefault();

    if (guestId) {
      socket.emit("joinRoom", {
        player: nickname,
        id: guestId,
        password: guestPassword,
      });
      setGuestId("");
      setGuestPassword("");
    }
  };

  const leaveRoom = () => {
    setRoomData(null);
    console.log("leave");
    socket.emit("leaveRoom", { id: roomData.id, player: nickname });
  };

  const getRoom = (roomId_) => {
    fetch("http://localhost:8000/get_room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: roomId_ }),
    })
      .then((response) => response.json())
      .then((res) => {
        console.log(res);
        console.log(nickname);

        /* ELIAS EL PROBLEMA ESTÁ ACAAAAAA
        POR ALGUNA RAZÓN EL nickname NO LO LEE, CONSOLE.LOG(nickname) NO IMPRIME NADAA */

        if (!res.players.includes(nickname)) {
          setRoomData(res);
        }
      })
      .catch((err) => console.log(err));
  };


  const startGame = () => {
    socket.emit('gameStarted', (roomData.id))
  }

  useEffect(() => {
    socket.on("roomUpdated", (roomId_) => {
      console.log("roomUpdated");
      getRoom(roomId_);
    });

    socket.on("roomClosed", () => {
      alert("¡la sala ha sido cerrada!");
      setRoomData(null);
    });

    socket.on("gameStarted", ()=> {
      console.log('El juego ha comenzado!')
    })
  }, []);

  return (
    <div className="home-panel">
      <h6>{nickname}</h6>
      {!roomData ? (
        <div>
          <form>
            <input
              placeholder="nickname..."
              onChange={(e) => {
                setNickname(e.target.value);
              }}
              value={nickname}
            />
          </form>
          <form onSubmit={joinRoom}>
            <input
              placeholder="room id..."
              onChange={(e) => setGuestId(e.target.value)}
              value={guestId}
            />
            <input
              type="password"
              placeholder="room password..."
              onChange={(e) => setGuestPassword(e.target.value)}
              value={guestPassword}
            />
            <button>join room</button>
          </form>
          <form onSubmit={createRoom}>
            <input
              type="password"
              placeholder="room password..."
              onChange={(e) => setHostPassword(e.target.value)}
              value={hostPassword}
            />
            <button>create room</button>
          </form>
        </div>
      ) : (
        <div>
          <h1>Estas en una sala</h1>
          <h5>{roomData.id}</h5>
          <ul>
            {roomData.players.map((player) => (
              <li key={player}>{player}</li>
            ))}
          </ul>
          {
            roomData.admin === nickname ? 
            <button onClick={startGame}>start game</button>
            : undefined
          }
          <button onClick={leaveRoom}>Salir</button>
        </div>
      )}
      <button onClick={() => socket.emit("sd")}>show socket data</button>
    </div>
  );
};

export default HomePanel;
