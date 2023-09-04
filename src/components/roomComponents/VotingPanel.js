import "../../stylesheets/roomComponents/VotingPanel.css";

import { useEffect, useState } from "react";

const CategoryPanel = ({words}) => {
  return (
    <div className="category-panel">
      <h3>{words[0].category}</h3>
      <div className="words-container">
      {words.map((obj) => (
        <div className="word-container">
          <h4>{obj.origin}:</h4>
          <p>letter: {obj.letter}</p>
          <p>{obj.word}</p>
        </div>
      ))}
      </div>
    </div>
  );
};

const VotingPanel = ({ words, categories, nickname}) => {
  const [orderedCategories, setOrderedCategories] = useState([]);

  useEffect(() => {
    const categories_ = categories.map(obj => {return obj.category});
  
    switch (categories_.length) {
      case 2:
        var category0 = words.filter((word) => word.category == categories_[0] && word.origin != nickname); // filtramos los elementos con category 1
        var category1 = words.filter((word) => word.category == categories_[1] && word.origin != nickname); // filtramos los elementos con category 2
  
        var orderedCategories_ = [...[category0], ...[category1]]; // usamos el operador spread para unir los arrays en uno nuevo
        setOrderedCategories(orderedCategories_);
        break;
      case 3:
        var category0 = words.filter((word) => word.category == categories_[0] && word.origin != nickname); // filtramos los elementos con category 1
        var category1 = words.filter((word) => word.category == categories_[1] && word.origin != nickname); // filtramos los elementos con category 2
        var category2 = words.filter((word) => word.category == categories_[2] && word.origin != nickname); // filtramos los elementos con category 3
  
        var orderedCategories_ = [...[category0], ...[category1], ...[category2]]; // usamos el operador spread para unir los arrays en uno nuevo
        setOrderedCategories(orderedCategories_);
        break;
      case 4:
        var category0 = words.filter((word) => word.category == categories_[0] && word.origin != nickname); // filtramos los elementos con category 1
        var category1 = words.filter((word) => word.category == categories_[1] && word.origin != nickname); // filtramos los elementos con category 2
        var category2 = words.filter((word) => word.category == categories_[2] && word.origin != nickname); // filtramos los elementos con category 3
        var category3 = words.filter((word) => word.category == categories_[3] && word.origin != nickname); // filtramos los elementos con category 4
  
        var orderedCategories_ = [...[category0], ...[category1], ...[category2], ...[category3]]; // usamos el operador spread para unir los arrays en uno nuevo
        setOrderedCategories(orderedCategories_);
        break;
    }
  }, []);

  return (
    <div className="voting-panel">
      <h1>Time to vote!</h1>
      {
        orderedCategories.map(c => (
          <CategoryPanel words={c}/>
        ))
      }
    </div>
  );
};

export default VotingPanel;
