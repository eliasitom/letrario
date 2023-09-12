import "../stylesheets/HomePanel.css";

import { v4 as uuidv4 } from "uuid";
import { useContext, useEffect, useState } from "react";

import CategoriesPanel from "./roomComponents/CategoriesPanel";
import PlayablePanel from "./roomComponents/PlayablePanel";
import GameTimer from "./roomComponents/GameTimer";
import RoomCard from "./RoomCard";
import VotingPanel from "./roomComponents/VotingPanel";

import { Context, ContextProvider } from "../context/Context";

const HomePanel = () => {
  const [nickname, setNickname] = useState("");

  //host room states
  const [hostPassword, setHostPassword] = useState("");
  const [hostName, setHostName] = useState("");

  //join room states
  const [guestId, setGuestId] = useState("");
  const [guestPassword, setGuestPassword] = useState("");

  //Rooms states
  const [rooms, setRooms] = useState([]);

  //current room states
  const [roomData, setRoomData] = useState(null);
  const [timer, setTimer] = useState(0);
  const [categoriesPanel, setCategoriesPanel] = useState(false);
  const [categorySubmited, setCategorySubmited] = useState(false);
  const [waitingPlayersC, setWaitingPlayersC] = useState(true); //Esperando categorias de jugadores...
  const [categoriesReadyT, setCategoriesReadyT] = useState(0); //Categorias listas temporizador...

  const {
    c_wordsAndCategories,
    c_setWordsAndCategories,
    c_socket: socket,
    c_setNickname,
    c_setRoomId,
  } = useContext(Context);

  const createRoom = (e) => {
    e.preventDefault();

    const data = {
      id: uuidv4(),
      name: hostName,
      admin: nickname,
      password: hostPassword,
      players: [nickname],
      lettersNotAvailable: [],
      answers: [],
    };

    socket.emit("createRoom", data);

    setRoomData(data);
  };

  const joinRoom = (guestId_) => {
    if (guestId_) {
      socket.emit("joinRoom", {
        player: nickname,
        id: guestId_,
        password: guestPassword,
      });
      setGuestId("");
      setGuestPassword("");
    }
  };

  const leaveRoom = () => {
    setRoomData(null);
    setCategoriesPanel(false);
    setCategorySubmited(false);
    setWaitingPlayersC(true);
    console.log("leave");
    socket.emit("leaveRoom", { id: roomData.id, player: nickname });
  };

  const getRoom = (roomId_) => {
    fetch("http://localhost:8000/api/get_room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: roomId_ }),
    })
      .then((response) => response.json())
      .then((res) => {
        if (!res.players.includes(nickname)) {
          setRoomData(res);

          c_setRoomId(roomId_); //Agregué esta línea
        }
      })
      .catch((err) => console.log(err));
  };

  const getRooms = () => {
    fetch("http://localhost:8000/api/get_rooms", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((res) => {
        setRooms(res.rooms);
      })
      .catch((err) => console.log(err));
  };

  const startGame = () => {
    socket.emit("gameStarted", roomData.id);
  };

  useEffect(() => {
    socket.on("roomUpdated", (roomId_) => {
      console.log("roomUpdated");
      getRoom(roomId_);
    });

    socket.on("roomClosed", () => {
      alert("¡la sala ha sido cerrada!");
      setRoomData(null);
    });

    socket.on("gameStarted", () => {
      console.log("El juego ha comenzado!");
    });

    socket.on("timer", (timer_) => {
      setTimer(timer_);

      if (timer_ === 1) {
        setCategoriesPanel(true);
      }
    });

    socket.on("allCategoriesReady", (data) => {
      getRoom(data.roomId);
      setWaitingPlayersC(false);
      console.log(
        `all categories ready! The initial player is ${data.initialPlayer}`
      );
    });

    socket.on("categoriesReadyTimer", (data) => {
      const { roomId, timer_ } = data;

      setCategoriesReadyT(timer_);

      if (timer_ === 0) {
        getRoom(roomId);
      }
    });

    socket.on("nextTurn", () => {
      getRoom(roomData.id);
    });

    socket.on("nextPlayer", (roomId_) => {
      getRoom(roomId_);
      socket.emit("startWritingTimer", roomId_);
    });

    socket.on("gameFinished", (data) => {
      c_setWordsAndCategories(data);
    });
  }, []);

  useEffect(() => {
    getRooms();
  }, []);

  useEffect(() => {
    c_setNickname(nickname);
  }, [nickname]);

  return (
    <ContextProvider>
      <div className="home-panel">
        <h1>LETRARIO</h1>
        {!roomData ? (
          <div>
            <form className="nickname-form card">
              <label>put your nickname!</label>
              <input
                placeholder="nickname..."
                onChange={(e) => {
                  setNickname(e.target.value);
                }}
                value={nickname}
              />
            </form>
            <form className="card" onSubmit={() => joinRoom(guestId)}>
              <label>join room</label>
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
            <form className="card" onSubmit={createRoom}>
              <label>create room</label>
              <input
                placeholder="room name..."
                onChange={(e) => setHostName(e.target.value)}
                value={hostName}
              />
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
          <div className="home-room">
            {!c_wordsAndCategories ? (
              <>
                <h5 className="home-room-id">room id: {roomData.id}</h5>
                {timer > 1 ? (
                  <GameTimer timer={timer} type={"startGame"} />
                ) : categoriesPanel ? (
                  <CategoriesPanel
                    roomId={roomData.id}
                    nickname={nickname}
                    socket={socket}
                    categorySubmited={() => {
                      setCategorySubmited(true);
                      setCategoriesPanel(false);
                    }}
                  />
                ) : categoriesReadyT > 0 ? (
                  <GameTimer type="categoriesReady" timer={categoriesReadyT} />
                ) : categorySubmited ? (
                  <PlayablePanel
                    nickname={nickname}
                    roomData={roomData}
                    socket={socket}
                    waitingPlayersC={waitingPlayersC}
                    getRoom={getRoom}
                  />
                ) : undefined}

                {roomData.admin === nickname ? (
                  <button className="start-button" onClick={startGame}>
                    start game
                  </button>
                ) : undefined}
                <button onClick={leaveRoom}>leave</button>
              </>
            ) : (
              <VotingPanel
                nickname={nickname}
                words={c_wordsAndCategories.words}
                categories={c_wordsAndCategories.categories}
              />
            )}
          </div>
        )}
        <div className="room-players-list">
          {roomData ? (
            <>
              <h3>current players {"(" + roomData.players.length + "/4)"}:</h3>
              {roomData.players.map((player) => (
                <p
                  className={roomData.turnOf === player ? "you-turn" : ""}
                  key={player}
                >
                  {player}
                </p>
              ))}
            </>
          ) : undefined}
        </div>
        <button style={{ marginTop: "20px" }} onClick={() => socket.emit("sd")}>
          show socket data
        </button>

        {!roomData
          ? rooms.map((current) => (
              <RoomCard
                key={current.id}
                name={current.name}
                players={current.players}
                handleJoin={() => joinRoom(current.id)}
              />
            ))
          : undefined}
      </div>
    </ContextProvider>
  );
};

export default HomePanel;
