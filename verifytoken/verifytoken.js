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



const verifySession = async (req, res, next) => {

    const verifySession = req.session.userId

    try { if (!verifySession) {
        return res.status(200).send({apiData:{}, resultCode: 1, message: "Invalid Session"})
    }

    }catch (err){
        return res.status(200).send({apiData:{}, resultCode: 1, message: "Invalid Session"});
    } next()
    // const token = req.cookies.authmee || '';
    // try {
    //     if (!token) {
    //         return res.status(200).send({apiData:{}, resultCode: 1, message: "Invalid Token"})
    //     }
    //     const decrypt = await jwt.verify(token, process.env.TOKEN_SECRET);
    //     req.user = {
    //         id: decrypt.uid,
    //         email: decrypt.email,
    //         name: decrypt.name
    //     };
    //     next();
    // } catch (err) {
    //     return res.status(200).send({apiData:{}, resultCode: 1, message: "Invalid Token"});
    // }
};

module.exports = verifySession;