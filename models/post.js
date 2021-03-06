const mongoose = require('mongoose');
autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;
require('dotenv/config');
const connection = mongoose.createConnection(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true },
);
autoIncrement.initialize(connection);

const postSchema = new mongoose.Schema({
  from: {
    type: Number,
    default: undefined,
  },
  postId: {
    type: { type: Number, ref: 'postId' },
  },
  whenTime: {
    type: String,
    max: 200,
    default: undefined,
  },
  text: {
    type: String,
    max: 3000,
  },
  likes: [{ type: Number }],

  comments: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'CommentsPost' },
  ],
});

// eslint-disable-next-line no-undef
postSchema.plugin(autoIncrement.plugin, {
  model: 'WallPosts',
  field: 'postId',
  startAt: 1,
  incrementBy: 1,
});

const WallPosts = mongoose.model('WallPosts', postSchema);
module.exports = WallPosts;
