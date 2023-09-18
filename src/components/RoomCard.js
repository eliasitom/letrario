import "../stylesheets/RoomCard.css";
import { useState } from "react";

const RoomCard = ({ name, players, handleJoin, inGame }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    handleJoin(password);
  }


  return (
    <div className="card">
      <p className="room-card-name">{name}</p>
      <div className="room-card-state">
        <div>
          <p>{inGame ? "In game" : "waiting for players"}</p>
          <div
            className={`room-card-graphic-state ${
              inGame ? "room-in-game" : "waiting-room"
            }`}
          />
        </div>
        <p className="room-card-players">players: {players.length}/4</p>
      </div>
      <form onSubmit={handleSubmit}>
        <input type="password" placeholder="room password..." onChange={(e) => setPassword(e.target.value)} value={password}/>
        <button>join</button>
      </form>
    </div>
  );
};

export default RoomCard;
