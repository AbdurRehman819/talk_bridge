const mongoose=require('mongoose');
const bcrypt=require('bcrypt');

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    profilePicture:{
        type:String,
        default:''
    },
    preferredLanguage:{
        type:String,
        default:'en'
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    resetPasswordToken:{
        type:String
    },
    resetPasswordExpiry:{
        type:Date
    },
    
},{ timestamps: true });

userSchema.pre('save',async function(next){
    const user=this;
    if(!user.isModified('password'))return next();

    try{const salt=await bcrypt.genSalt(10);
    const hashedPassword=await bcrypt.hash(user.password,salt);

    user.password=hashedPassword;

    next();
}catch(error){
    next(error);   
}});

userSchema.methods.comparePassword=async function(candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password);
}

const User = mongoose.model('User', userSchema);

module.exports = User;
