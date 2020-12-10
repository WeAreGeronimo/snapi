const router = require('express').Router({ mergeParams: true });
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const {registerValidation, loginValidation} = require('../validation/validation')
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
const verifySession = require("../verifytoken/verifytoken");
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

        req.session.userId = savedUser.uid
        res.send({id: savedUser.uid}).end();
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
    const token = jwt.sign({id: emailExist.uid, email: emailExist.email, name: emailExist.name}, process.env.TOKEN_SECRET);

    req.session.userId = emailExist.uid
    res.send({apiData:{id: emailExist.uid}, resultCode: 0}).end();
    // res.header('auth-token', token).send(token);
});



router.get('/auth/me', verifySession, async (req, res) => {

    // const token = req.cookies.authmee
    // const decrypt = await jwt.verify(token, process.env.TOKEN_SECRET);
    // req.user = {
    //     id: decrypt.id,
    //     email: decrypt.email,
    //     password: decrypt.password
    // };

    const userId = req.session.userId

    MongoClient.connect(process.env.DB_CONNECTION, function(err, db) {
        if (err) throw err;
        const dbo = db.db("db");
        //Find the first document in the customers collection:
        dbo.collection("users").findOne({uid: userId}, function(err, result) {
            if (err) throw err;
            res.status(200).send({apiData:{id: result.uid, email: result.email, name: result.name}, resultCode: 0})
            db.close();
        });
    });
});

router.post('/auth/logout', verifySession, async (req, res) => {

    const login = req.session.userId
    if(login){
        req.session.destroy(function(err) {
            res.status(200).send({apiData:{}, resultCode: 0, message: "Вы вышли из профиля.(foo)"})
        })
        res.status(200).send({apiData:{}, resultCode: 0, message: "Вы вышли из профиля."})
    } res.status(200).send({apiData:{}, resultCode: 0, message: "Вы неавторизованы."})





});


// router.post('/login')
module.exports = router;



