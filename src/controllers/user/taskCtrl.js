const TASK=require('../../models/user/taskModel');
const statusCode=require('../../utilities/httpCode');
const response=require('../../utilities/httpResponse');
const { catchAsyncError } = require('../../middlewares/catchAsyncError');
const { createTaskValidation,updateTaskValidation } = require('../../validations/taskValidation');
const { generateNextCustomId } = require('../../utilities/commonFunction');
const taskService=require('../../services/taskService');
const {getCache,setCache,deleteCache}=require('../../utilities/cache');
const userService=require('../../services/userService');
const mongoose=require('mongoose');

module.exports={
     createTask:catchAsyncError(async(req,res)=>{
        const { value, error } = createTaskValidation.validate(req.body);
        if(error){
            return response.responseHandlerWithError(res,false,statusCode.BAD_REQUEST,error.message);
        }
        const {assignedTo}=value;

        if(req.user.role==="user"){
            if(assignedTo && assignedTo !== req.user._id.toString()){
                return response.responseHandlerWithError(res,false,statusCode.BAD_REQUEST,'You are not authorized to assign this task to another user');
            }
            value.assignedTo=req.user._id;
        }

        else if (req.user.role === 'manager') {
            if (assignedTo) {
                const assignedUser = await userService.fetchUser({_id:new mongoose.Types.ObjectId(assignedTo)});
                if (!assignedUser) {
                    return response.responseHandlerWithError(
                        res,
                        false,
                        statusCode.NOT_FOUND,
                        'Assigned user not found'
                    );
                }

                if (!req.user.team || assignedUser.team?.toString() !== req.user.team.toString()) {
                    return response.responseHandlerWithError(
                        res,
                        false,
                        statusCode.FORBIDDEN,
                        'You can only assign tasks to your team members'
                    );
                }
            }
        
        }
        const taskId=await generateNextCustomId(TASK,'TASK','task_id');
        const taskData = {
            ...value,
            task_id: taskId,
            createdBy: req.user._id,
            createdByRole: req.user.role
        };

        const task = await taskService.addTask(taskData);

        await deleteCache(`tasks-${req.user._id}`);
        if(task.assignedTo){
            await deleteCache(`tasks-${task.assignedTo}`);
        }

        const io = req.app.get('io');
        let notificationStatus = {
            sent: false,
            message: '',
            assignedUserId: null,
            timestamp: null
        };

        if (task.assignedTo) {
            const assignedUserId = task.assignedTo.toString();
            notificationStatus.assignedUserId = assignedUserId;

            try {
                if (io) {
                    const sockets = await io.in(`user-${assignedUserId}`).fetchSockets();
                    const isUserConnected = sockets.length > 0;

                    if (isUserConnected) {
                        io.to(`user-${assignedUserId}`).emit('new-task', {
                            message: 'A new task has been assigned to you',
                            task: task,
                            assignedBy: {
                                id: req.user._id,
                                username: req.user.username,
                                role: req.user.role
                            },
                            timestamp: new Date()
                        });

                        notificationStatus.sent = true;
                        notificationStatus.message = `Real-time notification sent to user ${assignedUserId}`;
                        notificationStatus.timestamp = new Date().toISOString()
                    } else {
                        notificationStatus.sent = false;
                        notificationStatus.message = ` User ${assignedUserId} is not connected. Notification will be sent when user comes online.`;
                        notificationStatus.timestamp = new Date().toISOString();

                    }
                } else {
                    
                    notificationStatus.sent = false;
                    notificationStatus.message = 'Socket.io not initialized. Real-time notification unavailable.';
                    notificationStatus.timestamp = new Date().toISOString();

                    console.log(` [NOTIFICATION FAILED] Socket.io not available`);
                }
            } catch (error) {
                notificationStatus.sent = false;
                notificationStatus.message = ` Error sending notification: ${error.message}`;
                notificationStatus.timestamp = new Date().toISOString();

                console.error(` [NOTIFICATION ERROR]`, error);
            }
        } else {
            notificationStatus.message = ' No user assigned to this task.';
            console.log(` [NO ASSIGNMENT] Task ${task.task_id} created without assignment`);
        }

        response.responseHandlerWithData(
            res,
            true,
            statusCode.CREATED,
            'Task created successfully',
            {
                task: task,
                notification: notificationStatus 
            }
        );
     }),
     getTasks:catchAsyncError(async(req,res)=>{
       const page =req.query.page || 1;
       const limit=req.query.limit||10;
       const {
        status,
        priority,
        assignedTo,
        createdBy,
        search
    } = req.query;

       const filter={}

       const cacheKey = `tasks:${req.user._id}:${page}:${limit}:${JSON.stringify(req.query)}`;
       const cachedTasks = await getCache(cacheKey);
       if(cachedTasks){
        return response.responseHandlerWithData(res,true,statusCode.OK,'Tasks fetched successfully',cachedTasks);
       }

       if(req.user.role==="user"){
        filter.$or=[
            {createdBy:req.user._id},
            {assignedTo:req.user._id}
        ]
       }
       else if(req.user.role==="manager"){
        const teamMembers=await userService.fetchAllUsersByTeam(req.user.team);
        const memberIds=teamMembers.map(member=>new mongoose.Types.ObjectId(member._id));
        filter.$or=[
            {createdBy:{$in:memberIds}},
            {assignedTo:{$in:memberIds}},

        ]
       }
       if(status){
        filter.status=status;
       }
       if(priority){
        filter.priority=priority;
       }  
       if(assignedTo){
        filter.assignedTo=new mongoose.Types.ObjectId(assignedTo);
       }
       if(createdBy){
        filter.createdBy=new mongoose.Types.ObjectId(createdBy);
       }

       if(search){
        filter.$or=[
            {title:{$regex:search,$options:'i'}},
            {description:{$regex:search,$options:'i'}}
        ]
       }

       const tasks=await taskService.getAllTasks(filter,page,limit);
       await setCache(cacheKey,tasks,3600);
       return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'Tasks fetched successfully',tasks);
     }),

     getTaskById:catchAsyncError(async (req, res) => {
    const taskId =req.query.taskId;
    
    if (!taskId) {
        return response.responseHandlerWithError(
            res,
            false,
            statusCode.BAD_REQUEST,
            'Task ID is required'
        );
    }
    const task = await taskService.getTaskById(new mongoose.Types.ObjectId(taskId));
    
    if (!task) {
        return response.responseHandlerWithError(
            res,
            false,
            statusCode.NOT_FOUND,
            'Task not found'
        );
    }

    
    if (req.user.role === "user") {
        const isCreatedBy = task.createdBy?.toString() === req.user._id.toString();
        const isAssignedTo = task.assignedTo?.toString() === req.user._id.toString();
        
        if (!isCreatedBy && !isAssignedTo) {
            return response.responseHandlerWithError(
                res,
                false,
                statusCode.FORBIDDEN,
                'Access denied. You can only view your own tasks or tasks assigned to you.'
            );
        }
    }

    else if (req.user.role === "manager") {
        const isCreatedBy = task.createdBy?.toString() === req.user._id.toString();
        const isAssignedTo = task.assignedTo?.toString() === req.user._id.toString();
        if (isCreatedBy || isAssignedTo) {
        } else {
            const teamMembers = await userService.fetchAllUsersByTeam(req.user.team);
            const memberIds = teamMembers.map(member => member._id.toString());
            
            const taskCreatorId = task.createdBy?.toString();
            const taskAssigneeId = task.assignedTo?.toString();
            
            const isTeamMemberTask = 
                memberIds.includes(taskCreatorId) || 
                memberIds.includes(taskAssigneeId);
            
            if (!isTeamMemberTask) {
                return response.responseHandlerWithError(
                    res,
                    false,
                    statusCode.FORBIDDEN,
                    'Access denied. You can only view tasks of your team members.'
                );
            }
        }
    }

    response.responseHandlerWithData(
        res,
        true,
        statusCode.OK,
        'Task fetched successfully',
        task
    );
}),
   updateTask:catchAsyncError(async(req,res)=>{
    const taskId=req.query.taskId;
    const task=await taskService.getTaskById(new mongoose.Types.ObjectId(taskId));
    if(!task){
        return response.responseHandlerWithError(res,false,statusCode.NOT_FOUND,'Task not found');
    }
    const {value,error}=updateTaskValidation.validate(req.body);
    if(error){
        return response.responseHandlerWithError(res,false,statusCode.BAD_REQUEST,error.message);
    }

    if (req.user.role === 'user') {
        if (task.createdBy.toString() !== req.user._id.toString()) {
            return response.responseHandlerWithError(res, false, statusCode.FORBIDDEN, 'You can only update tasks you created');
        }
    }

    const updatedTask=await taskService.updateTask(taskId,value);

    await deleteCache(`tasks-${req.user._id}`);
    if(updatedTask.assignedTo){
        await deleteCache(`tasks-${updatedTask.assignedTo}`);
    }
    const io = req.app.get('io');
    if(io){
        const sockets = await io.in(`user-${task.assignedTo}`).fetchSockets();
        if(sockets.length > 0){
            io.to(`user-${task.assignedTo}`).emit('task-updated',{message:'Task updated successfully',task:task});
        }
    }
    return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'Task updated successfully',task);
   }),

   deleteTask:catchAsyncError(async(req,res)=>{
    const taskId=req.query.taskId;
    const task=await taskService.getTaskById(new mongoose.Types.ObjectId(taskId));
    if(!task){
        return response.responseHandlerWithError(res,false,statusCode.RESULTNOTFOUND,'Task not found');
    }

    if (req.user.role === 'user') {
        if (task.createdBy.toString() !== req.user._id.toString()) {
            return response.responseHandlerWithError(res, false, statusCode.FORBIDDEN, 'You can only delete tasks you created');
        }
    }
    const deletedTask=await taskService.deleteTask(taskId);
    await deleteCache(`tasks-${req.user._id}`);
    return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'Task deleted successfully',deletedTask);
   })
}