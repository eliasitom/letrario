import "../../stylesheets/roomComponents/WinnerPanel.css";

import { useContext } from "react";
import { Context } from "../../context/Context";

const WinnerPanel = ({ podium, admin, roomId }) => {
  const { c_socket: socket } = useContext(Context);

  const handleContinue = () => {
    console.log(roomId)
    socket.emit("endGame", roomId);
  } 

  return (
    <div className="winner-panel">
      <h2>★ Winners ★</h2>
      <div className="podium-items-container">
        {podium.map((current, index) => (
          <div className="podium-item" key={index}>
            <h3 className="podium-position">
              {index === 0
                ? "first place"
                : index === 1
                ? "second place"
                : index === 3
                ? "third place"
                : "fourth place"}
            </h3>
            <h3>{current.name}</h3>
            <p>{current.votes} points</p>
          </div>
        ))}
      </div>
      {
        admin ? <button onClick={handleContinue}>continue</button> : undefined
      }
    </div>
  );
};

export default WinnerPanel;
