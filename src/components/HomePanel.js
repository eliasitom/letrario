import "../stylesheets/HomePanel.css";

import { BsFillDice3Fill } from "react-icons/bs";
import { v4 as uuidv4 } from "uuid";
import { useContext, useEffect, useState } from "react";

import CategoriesPanel from "./roomComponents/CategoriesPanel";
import PlayablePanel from "./roomComponents/PlayablePanel";
import GameTimer from "./roomComponents/GameTimer";
import RoomCard from "./RoomCard";
import VotingPanel from "./roomComponents/VotingPanel";
import ChatPanel from "./roomComponents/ChatPanel";
import SettingsPanel from "./roomComponents/SettingsPanel";
import WinnerPanel from "./roomComponents/WinnerPanel";

import { Context, ContextProvider } from "../context/Context";

const premadeNicknames = require("../nicknames.json").premadeNicknames;
const premadeRoomNames = require("../roomNames.json").premadeRoomNames;

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
  const [podium, setPodium] = useState([]);
  const [premadeCategories, setPremadeCategories] = useState([]);

  const {
    c_wordsAndCategories,
    c_setWordsAndCategories,
    c_socket: socket,
    c_setNickname,
    c_setRoomId,
  } = useContext(Context);

  const getRandomNickname = () => {
    setNickname(
      premadeNicknames[Math.floor(Math.random() * premadeNicknames.length)]
    );
  };
  const getRandomRoomName = () => {
    setHostName(
      premadeRoomNames[Math.floor(Math.random() * premadeRoomNames.length)]
    );
  };

  const createRoom = (e) => {
    e.preventDefault();

    if(hostName && nickname) {
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
    } else {
      alert("do you need a nickname and room name to create a room!");
    }
  };

  const joinRoom = (guestId_, password_) => {
    if (guestId_ && nickname) {
      socket.emit("joinRoom", {
        player: nickname,
        id: guestId_,
        password: password_ ? password_ : guestPassword ? guestPassword : "",
      });

      setGuestId("");
      setGuestPassword("");
    } else {
      alert("do you need a nickname and room ID to join a room");
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
    console.log('getRoom...')
    fetch("http://localhost:8000/api/get_room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: roomId_ }),
    })
      .then((response) => response.json())
      .then((res) => {
        if (!res.players.includes(nickname)) {
          setRoomData(res);

          c_setRoomId(roomId_);
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
    if (roomData.players.length > 1) {
      socket.emit("gameStarted", roomData.id);
    }
  };

  useEffect(() => {
    socket.on("accessDenied", data => {
      if(data === 'duplicate nickname') {
        alert('There is already a player with this nickname! try with another.')
      } else if(data === "incorrect password") {
        alert("incorrect password! try again")
      }
    })
    socket.on("roomUpdated", (roomId_) => {
      getRoom(roomId_);
    });

    socket.on("roomClosed", () => {
      alert("¡la sala ha sido cerrada!");
      setRoomData(null);
    });

    socket.on("categoriesLots", (data) => {
      setPremadeCategories(data);
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

    socket.on("gameFinished", (data) => {
      c_setWordsAndCategories(data);
    });

    socket.on("showWinner", (data) => {
      const newPodium = [...data].sort((a, b) => b.votes - a.votes);
      setPodium(newPodium);
    });

    socket.on("endGame", (roomId) => {
      getRoom(roomId);

      setTimer(0);
      setCategoriesPanel(false);
      setCategorySubmited(false);
      setWaitingPlayersC(true);
      setCategoriesReadyT(0);
      setPodium([]);
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
        <h1 className="home-title">{!roomData ? "LETRARIO" : undefined}</h1>
        {!roomData ? (
          <div>
            <form className="nickname-form card">
              <label>put your nickname!</label>
              <div className="nickname-form-input">
                <input
                  placeholder="nickname..."
                  onChange={(e) => {
                    setNickname(e.target.value);
                  }}
                  value={nickname}
                />
                <div className="dice">
                  <BsFillDice3Fill onClick={getRandomNickname} />
                </div>
              </div>
            </form>
            <form
              className="card"
              onSubmit={(e) => {
                joinRoom(guestId);
                e.preventDefault();
              }}
            >
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
              <div className="create-room-name-input">
                <input
                  placeholder="room name..."
                  onChange={(e) => setHostName(e.target.value)}
                  value={hostName}
                />
                <div className="dice">
                  <BsFillDice3Fill onClick={getRandomRoomName} />
                </div>
              </div>
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
          <div className="home-room-main">
            <div className="home-room">
              {!roomData.inGame ? (
                <>
                  <p className="room-subtitle">
                    Finding the right letter is finding the right word! Don't
                    leave, Letrario is about to start!
                  </p>
                  {roomData.admin === nickname ? (
                    <SettingsPanel socket={socket} roomData={roomData} />
                  ) : undefined}
                </>
              ) : undefined}
              {!c_wordsAndCategories ? (
                <>
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
                      premadeCategories={premadeCategories}
                    />
                  ) : categoriesReadyT > 0 ? (
                    <GameTimer
                      type="categoriesReady"
                      timer={categoriesReadyT}
                    />
                  ) : categorySubmited ? (
                    <PlayablePanel
                      nickname={nickname}
                      roomData={roomData}
                      socket={socket}
                      waitingPlayersC={waitingPlayersC}
                    />
                  ) : undefined}

                  {roomData.admin === nickname && !roomData.inGame ? (
                    <button className="start-button" onClick={startGame}>
                      start game
                    </button>
                  ) : undefined}
                </>
              ) : podium.length === 0 ? (
                <VotingPanel
                  nickname={nickname}
                  words={c_wordsAndCategories.words}
                  categories={c_wordsAndCategories.categories}
                  roomData={roomData}
                />
              ) : (
                <WinnerPanel
                  podium={podium}
                  roomId={roomData.id}
                  admin={nickname === roomData.admin}
                />
              )}
            </div>
            <ChatPanel
              leaveRoom={leaveRoom}
              roomData={roomData}
              nickname={nickname}
            />
          </div>
        )}

        {!roomData
          ? rooms.map((current) => (
              <RoomCard
                key={current.id}
                name={current.name}
                players={current.players}
                inGame={current.inGame}
                handleJoin={(password) => {
                  if (!current.inGame) joinRoom(current.id, password);
                }}
              />
            ))
          : undefined}
      </div>
    </ContextProvider>
  );
};

export default HomePanel;
