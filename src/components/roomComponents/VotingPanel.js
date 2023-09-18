import "../../stylesheets/roomComponents/VotingPanel.css";

import { Context } from "../../context/Context";

import { BiLike, BiSolidLike, BiDislike, BiSolidDislike } from "react-icons/bi";
import { useEffect, useState, useContext } from "react";

const Word = ({ word, nickname }) => {
  const { c_socket } = useContext(Context);

  const [wordLiked, setWordLiked] = useState(false);
  const [wordDisliked, setWordDisliked] = useState(false);

  const [likeBy, setLikeBy] = useState("");
  const [word_, setWord_] = useState(null);

  const approveAnswer = () => {
    if (!wordLiked) {
      setWordLiked(true);
      setWordDisliked(false);

      c_socket.emit("approveAnswer", {
        word: word,
        player: nickname,
      });
    }
  };

  const disapproveAnswer = () => {
    if (!wordDisliked) {
      setWordDisliked(true);
      setWordLiked(false);

      c_socket.emit("disapproveAnswer", {
        word: word,
        player: nickname,
      });
    }
  };

  useEffect(() => {
    c_socket.on("approveAnswer", (data) => {
      if (data.word._id === word._id) {
        let timer = 3;

        setLikeBy(data.origin);
        setWord_(data.word);

        const number = setInterval(() => {
          timer--;
          if (timer == -1) {
            setLikeBy("");
            setWord_(null);
            clearInterval(number);
          }
        }, 1000);
      }
    });

    c_socket.on("disapproveAnswer", (data) => {
      if (data.word._id === word._id) {
        let timer = 3;

        setLikeBy(data.origin);
        setWord_(data.word);

        const number = setInterval(() => {
          timer--;
          if (timer == -1) {
            setLikeBy("");
            setWord_(null);
            clearInterval(number);
          }
        }, 1000);
      }
    });
  }, []);

  return (
    <div className="word-container">
      <h4>{word.origin}:</h4>
      <div>
        <p className="word-container-letter">{word.letter}</p>
        <p>{word.word}</p>
      </div>
      <div className="word-voting-container">
        <div>
          {!wordLiked ? (
            <BiLike className="svg-like" onClick={approveAnswer} />
          ) : (
            <BiSolidLike className="svg-like" onClick={approveAnswer} />
          )}
        </div>
        <div>
          {!wordDisliked ? (
            <BiDislike className="svg-dislike" onClick={disapproveAnswer} />
          ) : (
            <BiSolidDislike
              className="svg-dislike"
              onClick={disapproveAnswer}
            />
          )}
        </div>
      </div>
      <div className="word-container-notification">
        <p>
          {likeBy && word_ && word._id === word_._id
            ? `${likeBy} approved this answer!`
            : undefined}
        </p>
      </div>
    </div>
  );
};

const VotingPanel = ({ words, categories, nickname }) => {
  const [orderedCategories, setOrderedCategories] = useState([]);

  useEffect(() => {
    const categories_ = categories.map((obj) => {
      return obj.category;
    });

    switch (categories_.length) {
      case 2:
        var category0 = words.filter(
          (word) => word.category == categories_[0] && word.origin != nickname
        ); // filtramos los elementos con category 1
        var category1 = words.filter(
          (word) => word.category == categories_[1] && word.origin != nickname
        ); // filtramos los elementos con category 2

        var orderedCategories_ = [...[category0], ...[category1]]; // usamos el operador spread para unir los arrays en uno nuevo
        setOrderedCategories(orderedCategories_);
        break;
      case 3:
        var category0 = words.filter(
          (word) => word.category == categories_[0] && word.origin != nickname
        ); // filtramos los elementos con category 1
        var category1 = words.filter(
          (word) => word.category == categories_[1] && word.origin != nickname
        ); // filtramos los elementos con category 2
        var category2 = words.filter(
          (word) => word.category == categories_[2] && word.origin != nickname
        ); // filtramos los elementos con category 3

        var orderedCategories_ = [
          ...[category0],
          ...[category1],
          ...[category2],
        ]; // usamos el operador spread para unir los arrays en uno nuevo
        setOrderedCategories(orderedCategories_);
        break;
      case 4:
        var category0 = words.filter(
          (word) => word.category == categories_[0] && word.origin != nickname
        ); // filtramos los elementos con category 1
        var category1 = words.filter(
          (word) => word.category == categories_[1] && word.origin != nickname
        ); // filtramos los elementos con category 2
        var category2 = words.filter(
          (word) => word.category == categories_[2] && word.origin != nickname
        ); // filtramos los elementos con category 3
        var category3 = words.filter(
          (word) => word.category == categories_[3] && word.origin != nickname
        ); // filtramos los elementos con category 4

        var orderedCategories_ = [
          ...[category0],
          ...[category1],
          ...[category2],
          ...[category3],
        ]; // usamos el operador spread para unir los arrays en uno nuevo
        setOrderedCategories(orderedCategories_);
        break;
    }
  }, []);

  return (
    <div className="voting-panel">
      <h1>Time to vote!</h1>
      {orderedCategories.map((c) => (
        <div className="category-panel">
          <h3>{c[0].category}</h3>
          <div className="words-container">
            {c.map((current) => (
              <Word key={current._id} word={current} nickname={nickname} />
            ))}
          </div>
        </div>
      ))}
      <div className="confirm-feedback">
        <p>you are ready?</p>
        <BiLike />
      </div>
    </div>
  );
};

export default VotingPanel;
