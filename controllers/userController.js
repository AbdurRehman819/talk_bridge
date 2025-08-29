const User=require('../models/userModel');
const jwt=require('jsonwebtoken');
const emailVerificationTemplate=require('../templates/emailVerificationTemplate');
const resetPasswordTemplate=require('../templates/resetPasswordTemplate');
const sendMail=require('../utils/sendMail');
const { jwtAuthMiddleWare, generateToken } = require('../middlewares/jwtAuth');
require('dotenv').config();
const crypto = require('crypto');
exports.signup=async(req,res)=>{
    try{
        const {name, email, password, preferredLanguage} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({ message: 'All fields are required' });
        }
        if(!email.includes('@')){
            return res.status(400).json({ message: 'Invalid email format' });
        }
        const isExistUser=await User.findOne({email});
        if(isExistUser){
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser=new User({
            name,
            email,
            password,
            preferredLanguage
        });
        await newUser.save();

        const token=jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const verificationLink=`${process.env.CLIENT_URL}/api/auth/verify-email/${token}`;
        
        await sendMail({
            to: newUser.email,
            subject: 'Email Verification',
            html: emailVerificationTemplate(newUser.name, verificationLink)
        });
        res.status(201).json({ message: 'User created successfully. Please check your email to verify your account.' });

    }catch(error){
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


exports.verifyEmail=async(req,res)=>{
    try{
        const token=req.params.token;
        const {id}=jwt.verify(token, process.env.JWT_SECRET);
        const user=await User.findById(id);
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }

        user.isVerified=true;

        await user.save();
        res.status(200).json({ message: 'Email verified successfully' });
    }catch(error){
        console.error('Error during email verification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


exports.login=async(req,res)=>{
    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user=await User.findOne({email});
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch= await user.comparePassword(password);
        if(!isMatch){
            return res.status(401).json({ message: 'Password is incorrect' });
        }
        if(!user.isVerified){
            return res.status(403).json({ message: 'Please verify your email before logging in' });
        }
        
        const token= generateToken(user);
        res.status(200).json({ message: 'Login successful', token, 
            user: { id: user._id, name: user.name, email: user.email, 
                profilePicture: user.profilePicture,
                 preferredLanguage: user.preferredLanguage } });

    }catch(err){
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal server error' });
    }

}


exports.forgetPassword=async(req,res)=>{
    try{
        const {email}=req.body;
        if(!email){
            return res.status(400).json({ message: 'Email is required' });
        }
        const user=await User.findOne({email});
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        const token=crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken=token;
        user.resetPasswordExpiry=Date.now() + 3600000; // 1 hour
        await user.save();
        const resetLink=`${process.env.CLIENT_URL}/reset-password/${token}`;
        await sendMail({
            to: user.email,
            subject: 'Password Reset',
            html:resetPasswordTemplate(user.name, resetLink)
        });
        res.status(200).json({ message: 'Password reset link sent to your email' });
    }catch(err){
        console.error('Error during password reset:', err);
        res.status(500).json({ message: 'Internal server error' });

    }
}

exports.resetPassword=async(req,res)=>{
    try{
        const {confirmPassword, newPassword}=req.body;
        const token=req.params.token;
        if(!confirmPassword || !newPassword){
            return res.status(400).json({ message: 'New password and confirm password are required' });
        }
        if(newPassword !== confirmPassword){
            return res.status(400).json({ message: 'Passwords do not match' });
        }
        const user= await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() }
        });
        user.password=newPassword;
        user.resetPasswordToken=null;
        user.resetPasswordExpiry=null;
        await user.save();
        res.status(200).json({ message: 'Password reset successful' });
    }catch(err){
        console.error('Error during password reset:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}