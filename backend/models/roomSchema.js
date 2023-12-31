const { Schema, model, isObjectIdOrHexString } = require("mongoose");

const roomSchema = new Schema({
  id: {
    type: String,
    required: true, //Esto es para que el dato sea requerido
    unique: true, //Esto es para que el dato sea unico
  },
  name: {
    type: String,
  },
  admin: {
    type: String,
    required: true,
  },
  players: [String],
  playersVotes: [
    {
      name: String,
      votes: Number,
    },
  ],
  inGame: {
    type: Boolean,
    default: false,
  },
  turnOf: {
    type: String,
  },
  password: {
    type: String,
  },
  lettersNotAvailable: [String],
  categories: [
    {
      origin: String,
      letter: String,
      finished: Boolean,
      category: String,
    },
  ],
  currentCategory: {
    type: String,
  },
  words: [
    {
      word: String,
      letter: String,
      origin: String,
      category: String,
      likes: [],
      dislikes: [],
    },
  ],
  settings: {
    roundTime: {
      type: Number,
      default: 15,
    },
  },
  premadeCategories: [String]
});

module.exports = model("room", roomSchema);
