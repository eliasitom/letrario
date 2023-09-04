import '../stylesheets/RoomCard.css';


const RoomCard = ({ name, players, handleJoin }) => {
  return (
    <div className="card">
      <p className="room-card-name">{name}</p>
      <p className="room-card-players">players: {players.length}/4</p>
      <button onClick={handleJoin}>join</button>
    </div>
  );
};


export default RoomCard;