const mongoose = require('mongoose');
autoIncrement = require('mongoose-auto-increment');
require('dotenv/config');
const connection = mongoose.createConnection(process.env.DB_CONNECTION, { useNewUrlParser: true } );
autoIncrement.initialize(connection)


const userSchema = new mongoose.Schema({
    uid: {
        type: { type: Number, ref: 'uid' },
    },
   email: {
       type: String,
       required: true,
       min: 6,
       max: 100
   },
    password: {
        type: String,
        required: true,
        min: 8,
        max: 1024
    },
    repeat_password: {
        type: String,
        required: true,
        min: 8,
        max: 1024
    },
    date: {
       type: Date,
        default: Date.now
    }

});


const userMAI = connection.model('user', userSchema);

userSchema.plugin(autoIncrement.plugin, {
    model: 'user',
    field: 'uid',
    startAt: 1,
    incrementBy: 1
});

module.exports= mongoose.model('User', userSchema);