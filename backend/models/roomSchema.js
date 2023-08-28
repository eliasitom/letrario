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
  password: {
    type: String
  },
  lettersNotAvailable: [
    String
  ],
  answers: [
    Object
  ]
})

module.exports = model('room', roomSchema)