module.exports={
    responseHandlerWithData:(res,success,code,message,data)=>{
        return res.status(code).json({success,code,message,data})
    },
    responseHandlerWithError:(res,success,code,message)=>{
        return res.status(code).json({success,code,message})
    },
    responseHandlerWithMessage:(res,success,code,message)=>{
        return res.status(code).json({success,code,message})
    }
}