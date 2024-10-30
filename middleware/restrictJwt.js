
const jwt = require("jsonwebtoken");
let jwtSecret = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
    const authorization = req.headers.authorization || req.cookies.token;

    // console.log(authorization);
    if (!authorization) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    } else {

        jwt.verify(authorization, jwtSecret, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            } else {
                // console.log(decoded, `Ini hasil decoded`);
                req.user = decoded;
                next();
            }
        });
    }
};


