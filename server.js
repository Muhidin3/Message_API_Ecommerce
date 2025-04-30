import express from 'express';
import mongoose from 'mongoose';
import Message from './message.model.js';
import { Server } from 'socket.io';
import http from 'http'


const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });


async function ConnectDb() {
    try {
        await mongoose.connect('mongodb://localhost:27017/Ecom')
      
    } catch (error) {
        console.log(error)
        
    }
    
}

ConnectDb()

const users = new Map()
const server = http.createServer(app)
const io = new Server(server,{
  cors:{
    origin:'*'
  }
})


io.on('connection',socket=>{
  console.log(`socket is running ${socket.id}`)

  socket.on('register',userId=>{
    users.set(userId,socket.id)
    console.log(userId+'is connected with socket id'+socket.id)
  });

  socket.on('sendMessage',async(senderId,receiverId,message)=>{
    if (!senderId || !receiverId || !message) return;

    const newMessage = new Message({ senderId, receiverId, message });
    await newMessage.save()
    console.log('Message is Saved to Database')

    const receiverSocket = users.get(receiverId)
    if (receiverSocket) {
      io.to(receiverSocket).emit('reciveMessage',{
        senderId,
        message
      });
      console.log('message sent to user'+receiverId)
    }

  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
})




app.get('/api/message',async (req, res) => {
    const params = req.query
    const senderId = params.senderId
    const receiverId = params.receiverId
    const message = await Message.find({senderId:{$in:[senderId,receiverId]},}).sort({createdAt:-1}).limit(20)
    console.log('message') 
    res.json( message );
});

app.post('/api/message', async (req,res) => {
    const body = req.body

    const senderId = body.senderId
    const receiverId = body.receiverId
    const message = body.message
    const isRead = body.isRead
    const newMessage = new Message({senderId,receiverId,message,isRead})
    await newMessage.save()
    // console.log(newMessage)
    

  res.json({message:'gotit'})
})






app.listen(5000, () => {
  console.log(`Server is running at http://localhost:${4000}`);
})
