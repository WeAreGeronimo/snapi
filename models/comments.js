const mongoose = require('mongoose');
autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;
require('dotenv/config');
const connection = mongoose.createConnection(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true },
);
autoIncrement.initialize(connection);

const commentSchema = new mongoose.Schema({
  from: {
    type: Number,
    default: undefined,
  },
  commentId: {
    type: { type: Number, ref: 'commentId' },
  },
  whenTime: {
    type: String,
    max: 200,
    default: undefined,
  },
  textComment: {
    type: String,
    max: 2000,
    default: undefined,
  },
  likes: [{ type: Number }],
});

commentSchema.plugin(autoIncrement.plugin, {
  model: 'CommentsPost',
  field: 'commentId',
  startAt: 1,
  incrementBy: 1,
});

const CommentsPost = mongoose.model('CommentsPost', commentSchema);
module.exports = CommentsPost;
