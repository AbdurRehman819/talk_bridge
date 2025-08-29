const mongoose=require('mongoose');

const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/talk_bridge';

mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


const db=mongoose.connection;

db.on('connected', ()=>{
    console.log(`mongodb connected `);
});

db.on('disconnected',()=>{
    console.log('mongodb disconnected');
});

db.on('error',(error)=>console.log(`mongodb error: ${error}`));

module.exports = db;
