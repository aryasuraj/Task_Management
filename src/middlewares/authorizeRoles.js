const response=require('../utilities/httpResponse');
const statusCode=require('../utilities/httpCode');


exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return response.responseHandlerWithError(res,false,statusCode.FORBIDDEN,"Access denied: insufficient permissions");
      }
      next();
    };
  };
  