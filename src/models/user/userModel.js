const mongoose = require('mongoose');

const USER=mongoose.Schema({
    user_id:{
        type:String,
    },
    username:{
        type:String,
    },
    password:{
        type:String,
    },   
      email:{
        type:String,
    },
    status:{
        type:String,
        enum:['active','inactive',"deleted"],
        default:'active',
    },
    role:{
        type:String,
        enum:['admin','user',"manager"],
        default:'user',
    } ,
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teams',
      },
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
      refreshTokens: [{
        type: String
      }]
}, { timestamps: true })


const User = mongoose.model('users', USER);
module.exports = User;