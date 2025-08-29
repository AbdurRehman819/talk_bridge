const jwt= require('jsonwebtoken');
require('dotenv').config();
const jwtAuthMiddleWare=(req,res,next)=>{
    const authorization=req.headers.authorization;
    if(!authorization || !authorization.startsWith('Bearer')) return res.status(401).json({message:"Token not found"});
    
    const token=authorization.split(' ')[1];

    try{
        const decode=jwt.verify(token,process.env.JWT_SECRET);

        req.user=decode;
        next();

    }catch(err){
            console.log(err);
            res.status(500).json({error:"Invalid token"});
    }
}

const generateToken=(user)=>{
    const payload={email:user.email,id:user._id};

    return jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:'7d'});
    
}


module.exports={jwtAuthMiddleWare,generateToken};