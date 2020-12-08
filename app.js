const express = require('express');
const app = express();
const PORT = 2222;
const mongoose = require('mongoose');
require('dotenv/config');
const bodyParser = require('body-parser');
const postsRoute = require('./routes/posts');
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts')
const cookieParser = require('cookie-parser');
const verifyToken = require('./verifytoken/verifytoken');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;

const corsOptions = {
    origin: '*',
    credentials: true };


//middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/api/', authRoute);
app.use('/api/posts', postRoute)





app.get('/', (req, res) => {
    res.send('we are on home');
});



//connect to db
mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true},() => {
    console.log('connected')
})


app.listen(2222);