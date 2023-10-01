import { useState, useEffect, useContext, useRef } from "react";
import "../../stylesheets/roomComponents/ChatPanel.css";

import { BiSolidCrown } from "react-icons/bi";
import { FaCheck } from "react-icons/fa";

import { Context } from "../../context/Context";

const ChatPanel = ({ roomData, leaveRoom, nickname }) => {
  const { c_socket: socket } = useContext(Context);

  const [readyPlayers, setReadyPlayers] = useState([]);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const messagesContainerRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (message) {
      socket.emit("message", {
        roomId: roomData.id,
        message: { header: nickname, body: message },
      });
    }
  };

  useEffect(() => {
    socket.on("readyPlayer", (player) => {
      setReadyPlayers((prevState) => [...prevState, player]);
    });

    socket.on("endGame", () => {
      setReadyPlayers([]);
    });

    socket.on("message", (data) => {
      setMessages(prev => [...prev, data]);
    });
  }, []);

  useEffect(() => {
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="chat-panel-main">
      <div className="chat-panel">
        <h2>chat</h2>
        <div className="messages-container" ref={messagesContainerRef}>
          {messages.map((current) => (
            <div className={current.header === nickname ? "message-by-me" : "message"}>
              <h4>{current.header}:</h4>
              <p>{current.body}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="send a message..."
            onChange={(e) => setMessage(e.target.value)}
            value={message}
          />
          <button>send</button>
        </form>
      </div>
      <div className="room-players-list">
        <div className="players-container">
          <h3>current players {"(" + roomData.players.length + "/4)"}:</h3>
          {roomData.players.map((player) => (
            <div className="player-list-item" key={player}>
              <p className={`${roomData.turnOf === player ? "you-turn" : ""}`}>
                {player}
                {roomData.admin === player ? <BiSolidCrown /> : undefined}
              </p>
              {readyPlayers.includes(player) ? (
                <FaCheck style={{ marginLeft: "10px" }} />
              ) : undefined}
            </div>
          ))}
        </div>
        <div className="home-room-id-div">
          <p>Share this ID with your friends:</p>
          <h5>{roomData.id}</h5>
          <button onClick={leaveRoom}>leave</button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
