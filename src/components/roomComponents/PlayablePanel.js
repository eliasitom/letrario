import { useEffect, useState } from "react";
import "../../stylesheets/roomComponents/PlayablePanel.css";

const PlayablePanel = ({
  timer,
  roomData,
  nickname,
  socket,
  waitingPlayersC,
}) => {
  const allLetters = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
  ];

  const [playerResponse, setPlayerResponse] = useState("");
  const [myResponse, setMyResponse] = useState("");

  useEffect(() => {
    socket.on("playerWriting", (data) => {
      setPlayerResponse(data);
    });
  }, []);

  useEffect(() => {
    socket.emit("playerWriting", { myResponse, roomId: roomData.id });
  }, [myResponse]);

  return (
    <div className="room">
      <div className="letters-container">
        {!waitingPlayersC && roomData.turnOf === nickname
          ? allLetters.map((current) => (
              <p className="letter" key={current}>
                {current}
              </p>
            ))
          : undefined}

        {waitingPlayersC ? (
          <h3>Waiting categories from other players...</h3>
        ) : roomData.turnOf === nickname ? (
          <>
            <h3>{roomData.currentCategory}</h3>
            <form>
              <p>{timer}</p>
              <input
                placeholder="some thing..."
                onChange={(e) => setMyResponse(e.target.value)}
              />
              <button>send</button>
            </form>
          </>
        ) : (
          <div className="player-response-div">
            <h3>{roomData.currentCategory}</h3>
            <h3>{roomData.turnOf} is writing with the letter a:</h3>
            <p>{playerResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayablePanel;
