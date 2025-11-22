const TASK=require('../models/user/taskModel');
const mongoose=require('mongoose');
const { buildPipeline } = require('../utilities/pagination');

module.exports={
    addTask:async(data)=>{
        return await TASK.create(data);
    },
    getAllTasks:async(filter,page,limit)=>{
        const query=[
            {
                $match:filter
            },
            {
                $sort:{createdAt:-1}
            },
            buildPipeline(page,limit)
        ]
    const tasks=await TASK.aggregate(query);
    return tasks;
},
getTaskById:async(taskId)=>{
    return await TASK.findById(taskId);
},
updateTask:async(taskId,data)=>{
    return await TASK.findByIdAndUpdate(
        {_id:new mongoose.Types.ObjectId(taskId)},
        {
            $set:data
        },
        {new:true}
    );
},
deleteTask:async(taskId)=>{
    return await TASK.findByIdAndDelete(
        {_id:new mongoose.Types.ObjectId(taskId)}
    );
},
assignTask:async(taskId,userId)=>{
    return await TASK.findByIdAndUpdate(
        {_id:new mongoose.Types.ObjectId(taskId)},
        {
            $set:{assignedTo:new mongoose.Types.ObjectId(userId)}
        },
        {new:true}
    );
},

findAllTasks:async(data)=>{
    return await TASK.find(data);
}
}