const express = require('express');
const app = express();
const PORT = 2222;
const mongoose = require('mongoose');
require('dotenv/config');
const bodyParser = require('body-parser');
const postsRoute = require('./routes/posts');
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');
const profileRoute = require('./routes/profile');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const threeDays = 1000 * 60 * 60 * 72;
//connect to db

const options = {
  origin: 'http://react.app.com:3000',
  credentials: true,
  maxAge: 86500,
};

app.use(cors(options));
// app.use((req,res,next) => {
//
//     res.header("Access-Control-Allow-Origin", "http://react.app.com:3000");
//     res.header("Access-Control-Allow-Credentials", "true");
//      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//      res.header("Access-Control-Allow-Methods", 'PUT, POST, PATCH, DELETE, GET');
//     if(req.method === 'OPTIONS') {
//
//         res.header("Access-Control-Allow-Origin", "http://react.app.com:3000");
//         res.header("Access-Control-Allow-Credentials", "true");
//         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//         res.header("Access-Control-Allow-Methods", 'PUT, POST, PATCH, DELETE, GET');
//         return res.status(200).json({})
//     }next();
// })

// middlewares

app.use(
  session({
    secret: process.env.SECRET,
    secure: false,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      collection: 'storedSessions',
    }),
    cookie: {
      maxAge: threeDays,
      secure: false,
    },
  }),
);

app.use(express.json());
app.use('/api/', authRoute);
app.use('/api/posts', postRoute);
app.use('/profile/', profileRoute);

app.get('/road', (req, res) => {
  req.session.on = true;
  res.send('done');
});

app.get('/', (req, res) => {
  res.send('we are on home');
});

mongoose.connect(
  process.env.DB_CONNECTION,
  { useFindAndModify: false },
  { useNewUrlParser: true },
  () => {
    console.log('connected');
  },
);

app.listen(2222, 'api.app.com');
