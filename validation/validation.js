const Joi = require('@hapi/joi');

//register validation
const registerValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(100).email().required(),
        password: Joi.string().min(8).max(1024).required(),
        name: Joi.string().min(2).max(20).required(),
        surname: Joi.string().min(2).max(20).required(),
        sex: Joi.string(),
        nickname: Joi.string().max(50),
        dateOfBirthday: Joi.string().max(15),
        status: Joi.string().max(140),
        when: Joi.string(),
        hometown: Joi.string().max(20),
        mobilePhone: Joi.string().max(20),
        homePhone: Joi.string().max(20),
        icq: Joi.string().max(20),
        website: Joi.string().max(80),
        practice: Joi.string().max(200),
        interests: Joi.string().max(200),
        musicsLike: Joi.string().max(200),
        filmsLike: Joi.string().max(200),
        quotesLike: Joi.string().max(200),
        posts: Joi.array(),
        dialogs: Joi.array(),
        notes: Joi.array(),


    });
    return schema.validate(data);
}

const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(100).email().required(),
        password: Joi.string().min(8).max(1024).required()
    });
    return schema.validate(data);
}





module.exports.registerValidation = registerValidation
module.exports.loginValidation = loginValidation




