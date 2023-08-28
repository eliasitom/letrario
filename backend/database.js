const dbURI = 'mongodb+srv://Eliasito:ckroc123456789@cluster0.5kzub0s.mongodb.net/?retryWrites=true&w=majority'

const mongoose = require('mongoose');

mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .catch(err => console.log(err)) 

mongoose.connection.once('open', _ => {
    console.log('Database is connected to', dbURI)
})
mongoose.connection.on('error', err => {
    console.log(err)
})