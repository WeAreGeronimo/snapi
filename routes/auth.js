const router = require('express').Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const {registerValidation, loginValidation} = require('../validation/validation')
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
const verifyToken = require("../verifytoken/verifytoken");
const MongoClient = require('mongodb').MongoClient;
require('dotenv/config');







router.post('/register', async (req, res) => {

    const { error } = registerValidation(req.body);
    if(error){
       return res.status(400).send(error.details[0].message)
    }

    //checking of the user is already in the database
    const emailExist = await User.findOne({email: req.body.email})
    if (emailExist) {
        return res.status(400).send('Пользователь с таким email уже зарегистрирован!')
    }

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    //create a new user
    const user = new User ({
        email: req.body.email,
        password: hashedPassword,
        name: req.body.name,
        surname: req.body.surname,
        sex: req.body.sex
    })

    try {

        const savedUser = await user.save()
        const token = jwt.sign({id: savedUser.uid}, process.env.TOKEN_SECRET);
        res.cookie('authmee', token, {
            maxAge: 86400,
            httpOnly: true
        }).send({id: savedUser.uid}).end();
    }catch (err){
        res.status(400).send(err)
    }

    });

router.post('/login', async (req, res) => {
    const { error } = loginValidation(req.body);
    if(error){
        return res.status(400).send(error.details[0].message)
    }

    const emailExist = await User.findOne({email: req.body.email})
    if (!emailExist) return res.status(400).send('Логин или пароль введен не верно.')

    const passExist = await bcrypt.compare(req.body.password, emailExist.password);
    if(!passExist) return res.status(400).send('Пароль введен не верно.')

    //create and assign a token
    const token = jwt.sign({id: emailExist.uid}, process.env.TOKEN_SECRET);


    res.cookie('authmee', token, {
        maxAge: 86400,
        httpOnly: true
    }).send({id: emailExist.uid}).end();
    // res.header('auth-token', token).send(token);
});


router.get('/auth/me', verifyToken, async (req, res) => {

    const token = req.cookies.authmee
    const decrypt = await jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = {
        id: decrypt.id,
    };
    MongoClient.connect(process.env.DB_CONNECTION, function(err, db) {
        if (err) throw err;
        const dbo = db.db("db");
        //Find the first document in the customers collection:
        dbo.collection("users").findOne({uid: req.user.id}, function(err, result) {
            if (err) throw err;
            res.status(200).send({id: result.uid, email: result.email, name: result.name});
            db.close();
        });
    });
});



// router.post('/login')
module.exports = router;



