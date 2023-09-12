import { useEffect, useState } from "react";
import "../../stylesheets/roomComponents/PlayablePanel.css";

const PlayablePanel = ({ roomData, nickname, socket, waitingPlayersC }) => {
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










  const setMyResponse_ = (e) => {
    for (const letter of allLetters) {
      if((myResponse.length === 0 && letter.enabled && letter.letter === e) || myResponse.length > 0) {
        setMyResponse(e);
      }
    }
  }

  const letterSelected = (letter) => {
    socket.emit("letterSelected", { letter, roomId: roomData.id });

    setCurrentLetter(letter);
  };

  const submitWord = (e) => {
    if (e) {
      e.preventDefault();
    }

    if (currentLetter && myResponse) {
      setCurrentLetter("");

      const response = {
        word: myResponse,
        letter: currentLetter,
        origin: nickname,
        category: roomData.currentCategory,
      };

      socket.emit("submitWord", { response, roomId: roomData.id });
      socket.emit("stopWritingTimer");
    } else if (!currentLetter) {
      alert("Don't forget to select a letter!");
    } else if (!myResponse) {
      alert("Don't forget your answer!");
    }
  };

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
      const { timer_, roomId, turnOf } = data;

      if (timer_ === 0 && turnOf === nickname) {
        console.log(
          "turnOf: " + turnOf + " ____ " + "my nickname is: " + nickname
        );
        console.log({ roomId, player: nickname });
        socket.emit("startWritingTimer", { roomId, player: nickname });
      }
    });

    socket.on("writingTimer", (data) => {
      const { timer_ } = data;

      setWritingTimer(timer_);

      if (timer_ === 0) {
        submitWord();
      }
    });

    socket.on("nextPlayer", (turnOf) => {
      console.log(
        "turnOf: " + turnOf + " ____ " + "my nickname is: " + nickname
      );

      if (turnOf === nickname) {
        console.log("myTurn");
        console.log({ roomId: roomData.id, player: nickname });
        socket.emit("startWritingTimer", {
          roomId: roomData.id,
          player: nickname,
        });
      }
    });

    socket.on("categoryFinished", () => {
      let newLetters = allLetters;

      newLetters.map((c) => (c.enabled = true));

      setAllLetters(newLetters);
    });
  }, []);

  useEffect(() => {
    if (myResponse.length === 1 && !roomData.lettersNotAvailable.includes(myResponse)) {
      letterSelected(myResponse);
    }

    socket.emit("playerWriting", { myResponse, roomId: roomData.id });
  }, [myResponse]);

  return (
    <div className="room-container">
      <div className="letters-div">
        {!waitingPlayersC && roomData.turnOf === nickname
          ? allLetters.map((current) => (
              <p
                onClick={() =>
                  current.enabled ? letterSelected(current.letter) : undefined
                }
                className={`${!current.enabled ? "disabled" : "letter"} ${
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
          <form onSubmit={(e) => submitWord(e)}>
            <p>{writingTimer}</p>
            <input
              placeholder="some thing..."
              onChange={(e) => setMyResponse_(e.target.value)}
            />
            <div>
              <button>send</button>
            </div>
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
