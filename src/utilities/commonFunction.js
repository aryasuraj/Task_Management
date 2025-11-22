const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer=require('nodemailer');
const rateLimit=require('express-rate-limit');
const dotenv = require('dotenv');
dotenv.config();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

const getJwtToken = async (data) => {
    let token = jwt.sign(
        {
            _id: data,
        },
        process.env.JWT_SECRET);
    return token
}

const encryptPassword = async (data) => {
    let salt = await bcrypt.genSalt(10)
    if (salt) {
        let hash = await bcrypt.hash(data, salt)
        if (hash) {
            return hash
        }
        else
            return err
    }
    else
        return err
}

const encryptString = async (str) => {
    const salt = await bcrypt.genSaltSync(10)
    return bcrypt.hashSync(str, salt);
}

const compareEncryptString = async (str, encryptPass) => {
    return await bcrypt.compare(str, encryptPass);
}

const getOTP = async () => {
    var random = Math.floor(100000 + Math.random() * 900000)
    let otp = random.toString().substring(0, 4);
    return otp;
}

async function generateNextCustomId(model, prefix, key) {
    try {
        const lastDocument = await model.findOne({}, {}, { sort: { createdAt: -1 } });
        if (lastDocument) {
            const lastCustomIdParts = (lastDocument[key]).split('-');
            const lastNumber = parseInt(lastCustomIdParts[1]); 
            const nextNumber = lastNumber + 1;
            const newId = prefix + '-' + (nextNumber > 9 ? nextNumber : ('0' + nextNumber));
            const isExist = await model.findOne({ key: newId });
            if (isExist) {
                return generateNextCustomId(model, prefix, key);
            } else {
                return newId;
            }
        } else {
            return `${prefix}-01`; 
        }
    }
    catch (err) {
        return err.message;
    }
}



const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user:process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const sendConfirmationEmail = async ({ email,message }) => {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject:'Confirmation Email',
        text: message,
        html: `<p>${message}</p>`
      });
      console.log('Email sent successfully',info.messageId);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  };




      const otpExpiryTime=()=>{
        const otpExpiryTime=new Date(Date.now() + 1000 * 60 * 5);
        return otpExpiryTime;
      }

module.exports = {
    getJwtToken,
    getOTP: getOTP,
    generateNextCustomId,
    encryptString: encryptString,
    compareEncryptString: compareEncryptString,
    encryptPassword: encryptPassword,
    sendConfirmationEmail: sendConfirmationEmail,
    otpExpiryTime: otpExpiryTime,
    loginLimiter: loginLimiter
}
