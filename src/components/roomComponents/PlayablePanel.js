import { useEffect, useState } from "react";
import "../../stylesheets/roomComponents/PlayablePanel.css";

const PlayablePanel = ({
  roomData,
  nickname,
  socket,
  waitingPlayersC,
}) => {
  const [allLetters, setAllLetters] = useState([
    { letter: "a", enabled: true },
    { letter: "b", enabled: true },
    { letter: "c", enabled: true },
    { letter: "d", enabled: true },
    { letter: "e", enabled: true },
    { letter: "f", enabled: true },
    { letter: "g", enabled: true },
    { letter: "h", enabled: true },
    { letter: "i", enabled: true },
    { letter: "j", enabled: true },
    { letter: "k", enabled: true },
    { letter: "l", enabled: true },
    { letter: "m", enabled: true },
    { letter: "n", enabled: true },
    { letter: "o", enabled: true },
    { letter: "p", enabled: true },
    { letter: "q", enabled: true },
    { letter: "r", enabled: true },
    { letter: "s", enabled: true },
    { letter: "t", enabled: true },
    { letter: "u", enabled: true },
    { letter: "v", enabled: true },
    { letter: "w", enabled: true },
    { letter: "x", enabled: true },
    { letter: "y", enabled: true },
    { letter: "z", enabled: true },
  ]);

  const [playerResponse, setPlayerResponse] = useState("");
  const [myResponse, setMyResponse] = useState("");

  const [currentLetter, setCurrentLetter] = useState("");
  const [playerCurrentL, setPlayerCurrentL] = useState(""); //Player current letter...
  const [writingTimer, setWritingTimer] = useState(-1);

  const letterSelected = (letter) => {
    if (!currentLetter) {
      socket.emit("letterSelected", { letter, roomId: roomData.id });

      setCurrentLetter(letter);
    }
  };

  const submitWord = (e) => {
    if(e) {
      e.preventDefault();
    }

    const response = {
      word: myResponse,
      origin: nickname,
      category: roomData.currentCategory
    };

    socket.emit("submitWord", {response, roomId: roomData.id});
    
  }

  useEffect(() => {
    socket.on("playerWriting", (data) => {
      setPlayerResponse(data);
    });

    socket.on("letterSelected", (letter) => {
      let newLetters = allLetters;

      newLetters.map((current) => {
        if (current.letter === letter) {
          current.enabled = false;
        }
      });
      setAllLetters(newLetters);
      setPlayerCurrentL(letter);
    });

    socket.on("categoriesReadyTimer", (data) => {
      const {timer_, roomId} = data;

      if(timer_ === 0) {
        socket.emit("startWritingTimer", roomId)
      }
    });

    socket.on("writingTimer", data => {
      
      const {timer_} = data;

      setWritingTimer(timer_)

      if(timer_ === 0 && data.turnOf === nickname) {
        submitWord()
      }
    });
  }, []);

  useEffect(() => {
    socket.emit("playerWriting", { myResponse, roomId: roomData.id });
  }, [myResponse]);

  return (
    <div className="room-container">
      <div className="letters-div">
        {!waitingPlayersC && roomData.turnOf === nickname
          ? allLetters.map((current) => (
              <p
                onClick={() => letterSelected(current.letter)}
                className={`letter ${!current.enabled ? "disabled" : ""} ${
                  current.letter === currentLetter ? "current-letter" : ""
                }`}
                key={current.letter}
              >
                {current.letter}
              </p>
            ))
          : undefined}
      </div>

      {waitingPlayersC ? (
        <h3>Waiting categories from other players...</h3>
      ) : roomData.turnOf === nickname ? (
        <div className="room-response-div">
          <h3>{roomData.currentCategory}</h3>
          <form onSubmit={(e)=> submitWord(e)}>
            <p>{writingTimer}</p>
            <input
              placeholder="some thing..."
              onChange={(e) => setMyResponse(e.target.value)}
            />
            <button>send</button>
          </form>
        </div>
      ) : (
        <div className="player-response-div">
          <h2>{roomData.currentCategory}</h2>
          <h4>
            <span>{roomData.turnOf}</span> is writing{" "}
            <span>{roomData.currentCategory}</span> with the letter{" "}
            <span>{playerCurrentL}</span>:
          </h4>
          <p>{playerResponse}</p>
        </div>
      )}
    </div>
  );
};

export default PlayablePanel;
