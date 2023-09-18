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

  const [responseAlert, setResponseAlert] = useState('');







  const responseAlert_ = (alert) => {
    setResponseAlert(alert)
    
    let timer = 2;
    const number = setInterval(() => {
        timer--;

        if(timer === 0) {
          setResponseAlert('');
          clearInterval(number);
        }
    }, 1000);
  }

  const setMyResponse_ = (e) => {
    for (const letter of allLetters) {
      if (
        (myResponse.length === 0 && letter.enabled && letter.letter === e) ||
        myResponse.length > 0
      ) {
        setMyResponse(e);
      } else if (myResponse.length === 0 && !letter.enabled && letter.letter === e) {
        responseAlert_('someone has already used this letter!');
      } 
    }
  };

  const letterSelected = (letter) => {
    socket.emit("letterSelected", { letter, roomId: roomData.id });
    setCurrentLetter(letter);

    setMyResponse(letter)
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
      setPlayerCurrentL(letter);
    });

    socket.on("letterUsed", (letter) => {
      let newAllLetters = allLetters.map((current) => {
        if (current.letter === letter) current.enabled = false;
        return current;
      });

      setAllLetters(newAllLetters);
    });

    socket.on("categoriesReadyTimer", (data) => {
      const { timer_, roomId, turnOf } = data;

      if (timer_ === 0 && turnOf === nickname) {
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
      if (turnOf === nickname) {
        socket.emit("startWritingTimer", {
          roomId: roomData.id,
          player: nickname,
        });
      }
    });

    socket.on("categoryFinished", () => {
      let newAllLetters = allLetters.map((current) => {
        current.enabled = true;
        return current;
      });

      setAllLetters(newAllLetters);
    });
  }, []);

  useEffect(() => {
    if (
      myResponse.length === 1 &&
      !roomData.lettersNotAvailable.includes(myResponse)
    ) {
      letterSelected(myResponse);
    } else if(myResponse.length === 1 && 
      roomData.lettersNotAvailable.includes(myResponse)
      ) {
        setMyResponse('');
        letterSelected('');
        responseAlert_('someone has already used this letter!');
    } else if (myResponse.length === 0) {
      letterSelected('');
    }

    socket.emit("playerWriting", { myResponse, roomId: roomData.id });
  }, [myResponse]);

  return (
    <div className="room-container">
      <div className="letters-div">
        { 
        !waitingPlayersC ?
          allLetters.map((current) => (
              <p
                onClick={() =>
                  current.enabled && roomData.turnOf === nickname ? letterSelected(current.letter) : undefined
                }
                className={`${!current.enabled ? "disabled" : "letter"} ${
                  current.letter === currentLetter ? "current-letter" : ""
                }`}
              >
                {current.letter}
              </p>
            ))
           : undefined }
      </div>

      {waitingPlayersC ? (
        <h3>Waiting categories from other players...</h3>
      ) : roomData.turnOf === nickname ? (
        <div className="room-response-div">
          <h3>{roomData.currentCategory}</h3>
          <p className="room-response-alert">{responseAlert}</p>
          <form onSubmit={(e) => submitWord(e)}>
            <p className="room-response-timer">{writingTimer}</p>
            <input
              placeholder="some thing..."
              onChange={(e) => setMyResponse_(e.target.value)}
              value={myResponse}
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
            <span style={{textTransform: 'uppercase'}}>{playerCurrentL}</span>:
          </h4>
          <p>{playerResponse}</p>
        </div>
      )}
    </div>
  );
};

export default PlayablePanel;
