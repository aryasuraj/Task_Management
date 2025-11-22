const TASK=require('../../models/user/taskModel');
const statusCode=require('../../utilities/httpCode');
const response=require('../../utilities/httpResponse');
const { catchAsyncError } = require('../../middlewares/catchAsyncError');
const taskService=require('../../services/taskService');
const userService=require('../../services/userService');



module.exports={
    assignTask:catchAsyncError(async(req,res)=>{
        const {taskId,userId}=req.body;
        const task=await taskService.getTaskById(taskId);
        if(!task){
            return response.responseHandlerWithError(res,false,statusCode.RESULTNOTFOUND,'Task not found');
        }
        if(req.user.role==="user"){
            if(task.createdBy.toString() !== req.user._id.toString()){
                return response.responseHandlerWithError(res,false,statusCode.FORBIDDEN,'You are not authorized to assign this task');
            }
        }
        else if(req.user.role==="manager"){
           const assignedUser=await userService.fetchUserById(userId);
           if(!assignedUser || assignedUser.team.toString() !== req.user.team.toString()){
            return response.responseHandlerWithError(res,false,statusCode.FORBIDDEN,'You are not authorized to assign this task to this user');
           }
        }
     
        const assignedTask=await taskService.assignTask(taskId,userId);
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${userId}`).emit('task-assigned', {
              message: 'A new task has been assigned to you',
              task:assignedTask
            });
          }
        return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'Task assigned successfully',assignedTask);
    
    }),

    uupdateAssignment:catchAsyncError(async(req,res)=>{
        const {taskId,userId}=req.body;
        const task=await taskService.getTaskById(taskId);
        if(!task){
            return response.responseHandlerWithError(res,false,statusCode.RESULTNOTFOUND,'Task not found');
        }
        if(req.user.role==="user"){
            if(task.createdBy?.toString() !== req.user._id?.toString()){
                return response.responseHandlerWithError(res,false,statusCode.FORBIDDEN,'You are not authorized to update this task');
            }
        }
        else if(req.user.role==="manager"){
            const assignedUser=await userService.fetchUserById(userId);
            if(!assignedUser || assignedUser.team?.toString() !== req.user.team?.toString()){
                return response.responseHandlerWithError(res,false,statusCode.FORBIDDEN,'You are not authorized to update this task');
            }
        }
        if(task.assignedTo?.toString() === userId){
            return response.responseHandlerWithError(res,false,statusCode.BAD_REQUEST,'Task is already assigned to this user');
        }
        const updatedTask=await taskService.assignTask(taskId,userId);
        const io = req.app.get('io');
        if (io && task.assignedTo) {
            io.to(`user-${task.assignedTo}`).emit('task-assignment-updated', {
              message: 'Your task assignment has been updated',
              task:updatedTask
            });
          }
        return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'Task assignment updated successfully',updatedTask);
    }),

    getAssignedTasks:catchAsyncError(async(req,res)=>{
        const page=req.query.page||1;
        const limit=req.query.limit||10;
        const { userId, status } = req.query;
        const filter={};
        if(userId){
            filter.assignedTo=new mongoose.Types.ObjectId(userId);
        }else{
            filter.assignedTo=req.user._id;
        }
        if(status){
            filter.status=status;
        }

        if(req.user.role==="user"){
            if(userId && userId !== req.user._id.toString()){
                return response.responseHandlerWithError(res,false,statusCode.FORBIDDEN,'You are not authorized to get this user\'s tasks');
            }
        }
        else if(req.user.role==="manager"){
            if(userId){
                const assignedUser=await userService.fetchUserById(userId);
                if(!assignedUser || assignedUser.team?.toString() !== req.user.team?.toString()){
                    return response.responseHandlerWithError(res,false,statusCode.FORBIDDEN,'You are not authorized to get this user\'s tasks');
                }
            }
        }
        
        const tasks=await taskService.getAllTasks(filter,page,limit);
        return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'Assigned tasks fetched successfully',tasks);
    }),
}