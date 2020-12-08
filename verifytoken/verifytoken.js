require('dotenv/config');
const jwt = require('jsonwebtoken');

// module.exports =function auth (req,res,next){
//   const token = req.header('auth-token');
//   if(!token) return res.status(401).send('Доступ запрещен.');
//
//   try {
//       const verified = jwt.verify(token, process.env.TOKEN_SECRET);
//       req.user = verified;
//       next();
//   }catch (err){
//       res.status(400).send('Invalid token');
//   }
// }



const verifyToken = async (req, res, next) => {
    const token = req.cookies.authmee || '';
    try {
        if (!token) {
            return res.status(401).json('You need to Login')
        }
        const decrypt = await jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = {
            id: decrypt.id,
        };
        next();
    } catch (err) {
        return res.status(400).send('Invalid token');
    }
};

module.exports = verifyToken;