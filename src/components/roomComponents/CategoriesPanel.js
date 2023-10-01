import "../../stylesheets/roomComponents/CategoriesPanel.css";

import { useState } from "react";

const CategoriesPanel = ({
  categorySubmited,
  roomId,
  nickname,
  socket,
  premadeCategories,
}) => {
  const [category, setCategory] = useState("");

  const sendCategory = (e) => {
    e.preventDefault();

    if(category) {
      fetch("http://localhost:8000/api/send_category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, roomId, player: nickname }),
    })
      .then((response) => response.json())
      .then((res) => {
        if (res.message === "all players send a category!") {
          socket.emit("allCategoriesReady", roomId);
        }
        categorySubmited();
      })
      .catch((err) => console.log(err));
    } else {
      alert("don't forget to write a category!");
    }
  };

  return (
    <div className="categories-panel">
      <h3>Send a category!</h3>
      <form onSubmit={sendCategory}>
        <input
          placeholder="Example: countries..."
          onChange={(e) => setCategory(e.target.value)}
          value={category}
        />
        <div>
          <button>send</button>
        </div>
      </form>

      <div className="premade-categories-div">
        <h3>premade categories:</h3>
        <div>
          {premadeCategories.map((current) => {
            return current.player === nickname
              ? current.categories.map((c, index) => (
                  <p key={index} className="premade-category" onClick={() => setCategory(c)}>
                    {c}
                  </p>
                ))
              : undefined;
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPanel;
