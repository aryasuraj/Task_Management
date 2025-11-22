const teamModel = require('../models/user/teamModel');
const mongoose = require('mongoose');
module.exports={
    createTeam:async(data)=>{
        return await teamModel.create(data);
    }
}