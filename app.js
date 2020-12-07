const express = require('express');
const app = express();
const PORT = 2222;
const mongoose = require('mongoose');
require('dotenv/config');
const bodyParser = require('body-parser');
const postsRoute = require('./routes/posts');
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts')

//middlewares
app.use(express.json());
app.use('/api/user', authRoute);
app.use('/api/posts', postRoute)




app.get('/', (req, res) => {
    res.send('we are on home');
});



//connect to db
mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true},() => {
    console.log('connected')
})


app.listen(2222);