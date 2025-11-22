const USER=require('../models/user/usermodel');
const mongoose=require('mongoose');
const { buildPipeline } = require('../utilities/pagination');


module.exports={
    createUser:async(data)=>{
        return await USER.create(data);
    },
    fetchUser:async(data)=>{
        return await USER.findOne(data);
    },
    updateUser:async(id,data)=>{
        return await USER.findByIdAndUpdate(
            {_id:new mongoose.Types.ObjectId(id)},
            {
                $set:data
            },
            {new:true}
        );
    },
    fetchAllUsers:async(filter,page,limit)=>{
       const query=[
        {
            $match:filter
        },
        {
           $sort:{createdAt:-1}
        },
        buildPipeline(page,limit)
       ]
       return await USER.aggregate(query);
    },

    addRefreshToken: async (id, token, maxSessions = 5) => {
        const update = {
          $push: { refreshTokens: { $each: [token], $position: 0 } }
        };
        const doc = await USER.findByIdAndUpdate(new mongoose.Types.ObjectId(id), update, { new: true }).exec();
        if (!doc) return doc;
    
        if (Array.isArray(doc.refreshTokens) && doc.refreshTokens.length > maxSessions) {
          const trimmed = doc.refreshTokens.slice(0, maxSessions);
          await USER.findByIdAndUpdate(new mongoose.Types.ObjectId(id), { $set: { refreshTokens: trimmed } }).exec();
          doc.refreshTokens = trimmed;
        }
        return doc;
      },



    removeRefreshToken: async (id, token) => {
        if (!token) {
          console.log("TOKEN MISSING");
          return;
        }
      
        const cleanToken = String(token).trim();
      
        console.log("Removing token:", cleanToken);
      
        return await USER.findByIdAndUpdate(
          new mongoose.Types.ObjectId(id),
          { 
            $pull: { 
              refreshTokens: cleanToken 
            } 
          },
          { new: true }
        ).exec();
      },
      
      
      clearRefreshTokens: async (id) => {
        return await USER.findByIdAndUpdate(new mongoose.Types.ObjectId(id), { $set: { refreshTokens: [] } }, { new: true }).exec();
      },

      fetchAllUsersByTeam:async(team)=>{
        return await USER.find({team:new mongoose.Types.ObjectId(team)});
      },
      fetchUserById:async(id)=>{
        return await USER.findById(new mongoose.Types.ObjectId(id));
      }

    
}