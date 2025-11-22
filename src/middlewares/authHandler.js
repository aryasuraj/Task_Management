const jwt = require('jsonwebtoken');
const response = require("../utilities/httpResponse");
const statusCode = require("../utilities/httpCode");
const USER = require("../models/user/userModel");

module.exports={
    authUser: async (req, res, next) => {
        try {
            if (!req.headers.authorization) {
                console.log("Token is missing");
                return response.responseHandlerWithError(res, false, statusCode.UNAUTHORIZED, "Please provide authorization token");
            }
            jwt.verify(req.headers.authorization, process.env.JWT_SECRET, async (error, result) => {
                if (error) {
                    console.log("Invalid Token1")
                    return response.responseHandlerWithError(res, false, statusCode.UNAUTHORIZED, "Invalid Token");
                }
                let user = await USER.findOne({ _id: result._id });
                if (!user) {
                    console.log("Invalid Token2");
                    return response.responseHandlerWithError(res, false, statusCode.UNAUTHORIZED, "Invalid Token");
                }
                req.user = user;
                if (user.status!=="active"){
                    return response.responseHandlerWithError(res, false, statusCode.UNAUTHORIZED, "Your account has been deleted or blocked. Please connect with support for futher information");
                }
                console.log("TOKEN user==========>", req.user)
                next();
            })
        } catch (error) {
            console.log("Error is============>", error)
            return response.responseHandlerWithError(res, false, statusCode.ERROR, "Internal server error", error.message);
        }
    }
}