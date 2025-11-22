const teamModel = require('../../models/user/teamModel');
const statusCode = require('../../utilities/httpCode');
const response = require('../../utilities/httpResponse');
const { catchAsyncError } = require('../../middlewares/catchAsyncError');
const userService = require('../../services/userService');
const teamService = require('../../services/teamService');
module.exports={
    createTeam:catchAsyncError(async(req,res)=>{
        const {name,membersIds}=req.body;
        const manager=await userService.fetchUserById(req.user._id);
        if(!manager){
            return response.responseHandlerWithError(res,false,statusCode.RESULTNOTFOUND,'Manager not found');
        }
        const members=await userService.fetchUserByIds(membersIds);
        if(members.length!==membersIds.length){
            return response.responseHandlerWithError(res,false,statusCode.RESULTNOTFOUND,'Members not found');
        }
        const team=await teamService.createTeam({name,manager:manager._id,members:members.map(member=>member._id)});
        return response.responseHandlerWithData(res,true,statusCode.CREATED,'Team created successfully',team);
    })
}