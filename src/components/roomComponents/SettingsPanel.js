import { useEffect, useState } from "react";
import "../../stylesheets/roomComponents/SettingsPanel.css";

const SettingsPanel = ({roomData, socket}) => {
  const [roundTime, setRoundTime] = useState(15);

  useEffect(()=> {
    if(roomData) {
      socket.emit("changeRoundTime", {roomId: roomData.id, roundTime})
    }
  }, [roundTime])



  return (
    <div className="settings-panel">
      <p className="settings-title">Settings</p>
      <div className="settings-container">
        <div>
          <p className="setting-title">round time</p>
          <button className={roundTime === 5 ? "current-round-time" : ""} onClick={() => setRoundTime(5)}>5s</button>
          <button className={roundTime === 10 ? "current-round-time" : ""} onClick={() => setRoundTime(10)}>10s</button>
          <button className={roundTime === 15 ? "current-round-time" : ""} onClick={() => setRoundTime(15)}>15s</button>
          <button className={roundTime === 20 ? "current-round-time" : ""} onClick={() => setRoundTime(20)}>20s</button>
          <button className={roundTime === 25 ? "current-round-time" : ""} onClick={() => setRoundTime(25)}>25s</button>
          <button className={roundTime === 30 ? "current-round-time" : ""} onClick={() => setRoundTime(9999)}>9999s</button>
        </div>
        <div className="allow-sentences">
          allow sentences <input type="checkbox" />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
