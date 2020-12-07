const router = require('express').Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const {registerValidation, loginValidation} = require('../validation/validation')
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');






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
        repeat_password: req.body.repeat_password
    })

    try {
        const savedUser = await user.save()
        res.send({id: savedUser.uid})
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
    res.header('auth-token', token).send(token);
});

// router.post('/login')
module.exports = router;



