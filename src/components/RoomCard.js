import '../stylesheets/RoomCard.css';


const RoomCard = ({ roomId, players, handleJoin }) => {
  return (
    <div className="room-card">
      <p className="room-card-id">{roomId}</p>
      <p className="room-card-players">players: {players.length}/4</p>
      <button onClick={handleJoin}>join</button>
    </div>
  );
};


export default RoomCard;