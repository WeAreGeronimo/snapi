const mongoose = require('mongoose');
autoIncrement = require('mongoose-auto-increment');
require('dotenv/config');
const Schema = mongoose.Schema;
const connection = mongoose.createConnection(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true },
);
autoIncrement.initialize(connection);
const Post = require('../models/post');

const userSchema = new mongoose.Schema({
  uid: {
    type: { type: Number, ref: 'uid' },
  },
  email: {
    type: String,
    required: true,
    min: 6,
    max: 100,
  },
  password: {
    type: String,
    required: true,
    min: 8,
    max: 1024,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    required: true,
    min: 2,
    max: 50,
  },
  surname: {
    type: String,
    required: true,
    min: 2,
    max: 50,
  },
  nickname: {
    type: String,
    max: 50,
    default: undefined,
  },
  sex: {
    type: String,
  },
  dateOfBirthday: {
    type: String,
    max: 15,
    default: undefined,
  },
  status: {
    statusText: {
      type: String,
      max: 140,
      default: undefined,
    },
    timeCreation: {
      type: String,
      default: undefined,
    },
  },
  location: {
    hometown: {
      type: String,
      max: 20,
      default: undefined,
    },
    city: {
      type: String,
      max: 20,
      default: undefined,
    },
  },
  contact_info: {
    mobilePhone: {
      type: String,
      max: 20,
      default: undefined,
    },
    homePhone: {
      type: String,
      max: 20,
      default: undefined,
    },
    icq: {
      type: String,
      max: 20,
      default: undefined,
    },
    website: {
      type: String,
      max: 80,
      default: undefined,
    },
  },
  personalInfo: {
    practice: {
      type: String,
      max: 200,
      default: undefined,
    },
    interests: {
      type: String,
      max: 200,
      default: undefined,
    },
    musicsLike: {
      type: String,
      max: 200,
      default: undefined,
    },
    filmsLike: {
      type: String,
      max: 200,
      default: undefined,
    },
    quotesLike: {
      type: String,
      max: 200,
      default: undefined,
    },
  },

  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WallPosts' }],
  dialogs: [],
  notes: [],
});

const userMAI = connection.model('user', userSchema);

userSchema.plugin(autoIncrement.plugin, {
  model: 'user',
  field: 'uid',
  startAt: 1,
  incrementBy: 1,
});

const User = mongoose.model('User', userSchema);
module.exports = User;
