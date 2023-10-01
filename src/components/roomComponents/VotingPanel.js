import "../../stylesheets/roomComponents/VotingPanel.css";

import { Context } from "../../context/Context";

import { BiLike, BiSolidLike, BiDislike, BiSolidDislike } from "react-icons/bi";

import { useEffect, useState, useContext } from "react";

// Word Panel

const Word = ({ word, nickname, approveAnswer_ }) => {
  const { c_socket } = useContext(Context);

  const [wordLiked, setWordLiked] = useState(false);
  const [wordDisliked, setWordDisliked] = useState(false);

  const [likeBy, setLikeBy] = useState("");
  const [word_, setWord_] = useState(null);

  const approveAnswer = () => {
    if (!wordLiked) {
      setWordLiked(true);
      setWordDisliked(false);

      if (!wordLiked && !wordDisliked) {
        approveAnswer_();
      }

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

      if (!wordLiked && !wordDisliked) {
        approveAnswer_();
      }

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

    c_socket.on("endGame", () => {
      setWordLiked(false);
      setWordDisliked(false);
      setLikeBy("");
      setWord_(null);
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

// Voting panel

const VotingPanel = ({ words, categories, nickname, roomData }) => {
  const [orderedCategories, setOrderedCategories] = useState([]);

  const [allWordsWithoutMe, setAllWordsWithoutMe] = useState(
    words.filter((current) => current.origin != nickname)
  );
  const [votesCount, setVotesCount] = useState(0);

  const { c_socket } = useContext(Context);

  const approveAnswer = () => {
    setVotesCount(votesCount + 1);
  };

  const showWinner = () => {
    //Se envía como word la primera palabra para que el servidor obtenga la room mediante esta
    c_socket.emit("showWinner", { word: allWordsWithoutMe[0] });
  };

  useEffect(() => {
    c_socket.on("endGame", () => {
      setOrderedCategories([]);
      setVotesCount(0);
    });
  }, []);

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

  useEffect(() => {
    if (votesCount === allWordsWithoutMe.length) {
      //Se envía como word la primera palabra para que el servidor obtenga la room mediante esta
      c_socket.emit("readyPlayer", {
        player: nickname,
        word: allWordsWithoutMe[0],
      });
    }
  }, [votesCount]);

  return (
    <div className="voting-panel">
      <h1>Time to vote!</h1>
      {orderedCategories.map((c, index) => (
        <div className="category-panel" key={index}>
          <h3>{c[0].category}:</h3>
          <div className="words-container">
            {c.map((current) => (
              <Word
                key={current._id}
                word={current}
                nickname={nickname}
                approveAnswer_={approveAnswer}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="confirm-feedback">
        <h2>
          words voted: {votesCount}/{allWordsWithoutMe.length}
        </h2>
        {roomData.admin === nickname &&
        votesCount === allWordsWithoutMe.length ? (
          <button onClick={showWinner}>show winner</button>
        ) : undefined}
      </div>
    </div>
  );
};

export default VotingPanel;
