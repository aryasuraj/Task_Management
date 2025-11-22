const joi = require('joi');

const signUpValidation = joi.object({
    username: joi.string().required().min(3).max(30),
    email: joi.string().email().required().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).required(),
    password: joi.string().required().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required(),
}).required();

const loginValidation = joi.object({
    email: joi.string().email().required().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).required(),
    password: joi.string().required().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required(),
}).required();

const updateUserProfileValidation = joi.object({
    username: joi.string().allow(null,"").optional(),
    email: joi.string().email().allow(null,"").optional(),
    password: joi.string().allow(null,"").optional(),
}).optional();

module.exports = {
    signUpValidation,
    loginValidation,
    updateUserProfileValidation
}