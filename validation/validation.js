const Joi = require('@hapi/joi');

//register validation
const registerValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(100).email().required(),
        password: Joi.string().min(8).max(1024).required().label('password'),
        repeat_password: Joi.any().equal(Joi.ref('password')).required(),
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



