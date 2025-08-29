const express=require('express');
const app=express();
require('./config/db');
require('dotenv').config();
const cors=require('cors');
const http = require('http');
const { Server } = require('socket.io');
const socketHandler=require('./socket/socketHandler');
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());


const messageRoutes=require('./routes/chatRoutes');
app.use('/api',messageRoutes);

const authRoutes=require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
const server= http.createServer(app);
const io=new Server(server,{
    cors:{
        origin:'*',
    }
});
socketHandler(io);

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})

