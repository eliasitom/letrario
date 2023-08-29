const { Schema, model } = require('mongoose')

const roomSchema = new Schema({
  id: {
    type: String,
    required: true, //Esto es para que el dato sea requerido
    unique: true //Esto es para que el dato sea unico
  },
  admin: {
    type: String,
    required: true,
  },
  players: [
    String
  ],
  turnOf: {
    type: String
  },
  password: {
    type: String
  },
  lettersNotAvailable: [
    String
  ],
  categories: [
    Object
  ],
  currentCategory: {
    type: String
  }
})

module.exports = model('room', roomSchema)