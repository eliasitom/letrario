import '../../stylesheets/roomComponents/CategoriesPanel.css'

import {useState} from 'react';

const CategoriesPanel = ({categorySubmited, roomId, nickname, socket}) => {
  const [category, setCategory] = useState('')

  const sendCategory = (e) => {
    e.preventDefault();

    fetch('http://localhost:8000/api/send_category', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({category, roomId, player: nickname})
    })
    .then(response => response.json())
    .then(res => {
      if(res.message === 'all players send a category!') {
        socket.emit('allCategoriesReady', roomId);
      }
      categorySubmited();
    })
    .catch(err => console.log(err))
  }

  return <div className="categories-panel">
    <h3>Send a category!</h3>
    <form onSubmit={sendCategory}>
      <input placeholder="Example: countries..." onChange={e => setCategory(e.target.value)} value={category}/>
      <button>send</button>
    </form>
  </div>;
};


export default CategoriesPanel;
