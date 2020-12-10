const router = require('express').Router({ mergeParams: true });
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const {registerValidation, loginValidation} = require('../validation/validation')
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
const verifyToken = require("../verifytoken/verifytoken");
require('dotenv/config');




router.get('/:id', async (req, res) => {

    const finded = await User.findOne({uid: req.params.id})
    res.send({id: finded.uid, email: finded.email, name: finded.name, surname: finded.surname});
   // await MongoClient.connect(process.env.DB_CONNECTION, function(err, db) {
   //      if (err) throw err;
   //      const dbo = db.db("db");
   //      //Find the first document in the customers collection:
   //      dbo.collection("users").findOne({uid: req.params.id}, function(err, result) {
   //          if (err) throw err;
   //          res.status(200).send({id: result.uid, email: result.email, name: result.name});
   //          db.close();
   //      });
   //  });
});


router.put('/status', async (req, res) => {
    const {status, timeCreation } = await req.body
    const finded = await User.findOneAndUpdate(
        {uid: req.session.userId},
        { status: {
            statusText: status,
            timeCreation: timeCreation
        }

        },
        {
            new: true,
        }
        )



    res.status(200).send("ok");

});

router.post('/status', async (req, res) => {

    const finded = await User.findOne({uid: req.body.userId})
    res.status(200).send({status: finded.status})

});
module.exports = router;



