const joi =require("joi");

const createTaskValidation = joi.object({
    title: joi.string().allow(null,"").optional(),
    description: joi.string().allow(null,"").optional(),
    dueDate: joi.date().required(),
    priority: joi.string().valid('low', 'medium', 'high', 'urgent').required(),
    status: joi.string().valid('pending', 'in-progress', 'completed', 'cancelled').required(),
    createdBy: joi.string().allow(null,"").optional(),
    assignedTo: joi.string().allow(null,"").optional(),
}).required();

const updateTaskValidation = joi.object({
    title: joi.string().allow(null,"").optional(),
    description: joi.string().allow(null,"").optional(),
    dueDate: joi.date().allow(null,"").optional(),
    priority: joi.string().valid('low', 'medium', 'high', 'urgent').allow(null,"").optional(),
    status: joi.string().valid('pending', 'in-progress', 'completed', 'cancelled').allow(null,"").optional(),
    assignedTo: joi.string().allow(null,"").optional(),
}).required();


module.exports = {
    createTaskValidation,
    updateTaskValidation
}