const USER=require('../../models/user/userModel');
const statusCode=require('../../utilities/httpCode');
const response=require('../../utilities/httpResponse');
const { catchAsyncError } = require('../../middlewares/catchAsyncError');
const { generateNextCustomId, encryptPassword, getJwtToken, sendConfirmationEmail, compareEncryptString } = require('../../utilities/commonFunction');
const userService=require('../../services/userService');
const { signUpValidation, loginValidation, updateUserProfileValidation } = require('../../validations/userValidation');
const mongoose=require('mongoose');
const maxSessions = 5;


module.exports={
    signUp:catchAsyncError(async(req,res)=>{
     const { value, error } = signUpValidation.validate(req.body);
     if(error){
        return response.responseHandlerWithError(res,false,statusCode.BAD_REQUEST,error.message);
     }
     const { username, email, password } = value;
      const user = await userService.fetchUser({
        $or:[ {email}, {username} ],
        status:{$ne:'deleted'}
        });
     
      if(user){
        return response.responseHandlerWithError(res,false,statusCode.CONFLICT,'User with this email or username already exists');
      }
      const userId=await generateNextCustomId(USER,'USER','user_id');
      const hashedPassword=await encryptPassword(password);
      req.body.user_id=userId;
      req.body.password=hashedPassword;
      const newUser=await userService.createUser(req.body);
      const token=await getJwtToken(newUser._id);
      const result = await userService.addRefreshToken(newUser._id,token,maxSessions);
      response.responseHandlerWithData(res,true,statusCode.CREATED,'User created successfully',result);
      await sendConfirmationEmail(
        { 
          email: newUser.email,
          message:`Hello ${newUser.username}, welcome to our platform!` 
        }
      );
      
     
    }),

    login:catchAsyncError(async(req,res)=>{
        const { value, error } = loginValidation.validate(req.body);
        if(error){
            return response.responseHandlerWithError(res,false,statusCode.BAD_REQUEST,error.message);
        }
        const { email, password } = value;
        const user = await userService.fetchUser({ 
            email:email,
            status:{$ne:'deleted'}
         });
        if(!user){
            return response.responseHandlerWithError(res,false,statusCode.UNAUTHORIZED,'User not found');
        }
        const currentTime = Date.now();
        if (user.lockUntil && user.lockUntil > currentTime) {
            const minutesLeft = Math.ceil((user.lockUntil - currentTime) / 60000);
            return response.responseHandlerWithError(
                res,
                false,
                statusCode.UNAUTHORIZED,
                `Account locked. Try again after ${minutesLeft} minutes`
            );
        }
    
        const isPasswordCorrect = await compareEncryptString(password, user.password);
        if (!isPasswordCorrect) {
            let attempts = user.failedAttempts + 1;
            let lockUntil = user.lockUntil;
    
            if (attempts >= 5) {
                lockUntil = Date.now() + 15 * 60 * 1000; 
            }
    
            await userService.updateUser(user._id, {
                failedAttempts: attempts,
                lockUntil
            });
    
            return response.responseHandlerWithError(
                res,
                false,
                statusCode.UNAUTHORIZED,
                attempts >= 5
                    ? "Too many failed attempts. Account locked for 15 minutes."
                    : "Invalid credentials"
            );
        }
        await userService.updateUser(user._id, {
            failedAttempts: 0,
            lockUntil: null
        });
        const token = await getJwtToken(user._id);
        const result = await userService.addRefreshToken(user._id,token,maxSessions);
        return response.responseHandlerWithData(
            res,
            true,
            statusCode.SUCCESS,
            'Login successful',
            result
        )

    }),

    logout:catchAsyncError(async(req,res)=>{
        const user=await userService.fetchUser({_id:req.user._id});
        if(!user){
            return response.responseHandlerWithError(res,false,statusCode.UNAUTHORIZED,'User not found');
        }
        
        const currentToken = req.headers.authorization;
        
        if (!currentToken) {
            return response.responseHandlerWithError(res,false,statusCode.BAD_REQUEST,'Token not found in header');
        }
        const result = await userService.removeRefreshToken(user._id, currentToken);
        
        return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'Logout successful',result);
    }),


    userProfile:catchAsyncError(async(req,res)=>{
        const user=await userService.fetchUser({_id:req.user._id});
        if(!user){
            return response.responseHandlerWithError(res,false,statusCode.UNAUTHORIZED,'User not found');
        }
        return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'User profile',user);
    }),

    updateUserProfile:catchAsyncError(async(req,res)=>{
        const { value, error } = updateUserProfileValidation.validate(req.body);
        if(error){
            return response.responseHandlerWithError(res,false,statusCode.BAD_REQUEST,error.message);
        }
        const user=await userService.fetchUser({_id:req.user._id});
        if(!user){
            return response.responseHandlerWithError(res,false,statusCode.UNAUTHORIZED,'User not found');
        }
        const result = await userService.updateUser(user._id,value);
        return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'User profile updated',result);
    }),


    deleteUser:catchAsyncError(async(req,res)=>{
        const user = await userService.fetchUser({_id:new mongoose.Types.ObjectId(req.body.userId)});
        if(!user){
            return response.responseHandlerWithError(res,false,statusCode.UNAUTHORIZED,'User not found');
        }
        const result = await userService.updateUser(user._id,{status:'deleted'});
        return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'User deleted',result);
    }),


    getAllUsers:catchAsyncError(async(req,res)=>{
        const page=req.query.page || 1;
        const limit=req.query.limit || 10;
        const filter={
            status:{$ne:'deleted'}
        }
        if(req.query.role){
            filter.role=req.query.role;
        }
        if(req.query.search){
            filter.$or=[
                {username:{$regex:req.query.search,$options:'i'}},
                {email:{$regex:req.query.search,$options:'i'}}
            ]
        }

        
        if(req.query.role==="manager"){
            filter.team=req.user.team;
        }
       
        const Allusers=await userService.fetchAllUsers(filter,page,limit);
        return response.responseHandlerWithData(res,true,statusCode.SUCCESS,'All users',Allusers);
  
    })



}