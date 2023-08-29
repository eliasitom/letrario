

const GameTimer = ({ timer, type }) => {
  return (
    <div>
      <h3>
        {
          type === 'startGame' ?
          'The game is about to start!' : type === 'categoriesReady' ?
          'Categories ready!' : undefined
        }
        </h3>
      <h2>{timer}</h2>
    </div>
  );
};


export default GameTimer;