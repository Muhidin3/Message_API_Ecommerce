import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import Message from './message.model.js';
import User from './users.model.js';
import { configDotenv } from 'dotenv';


const app = express();
const server = http.createServer(app);
app.use(express.urlencoded({ extended: true }));

const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Middleware
app.use(cors());
app.use(express.json());

configDotenv()
mongoose.connect(process.env.MONGO_URL).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));


const users = new Map(); // userId => socketId


io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

  // regitering user to socket
  socket.on('register', userId => {
    users.set(userId, socket.id);
    console.log(`User registered: ${userId} => ${socket.id}`);
  });

  // getting message from sender
  socket.on('sendMessage', async ({ senderId, receiverId, text }) => {
      if (!senderId || !receiverId || !text) return;

      // Save to messgae
      const message = new Message({ senderId, receiverId, message:text });
      await message.save();
      console.log('Message saved:', message);

    // Send to receiver if online
      const receiverSocket = users.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', {
          senderId,
          text,
          timestamp: message.timestamp
        });
        console.log(`Sent message to ${receiverId}`);
      }
    });

  // Remove user from map on disconnect
  socket.on('disconnect', () => {
    for (let [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
  
});

// Express routes
app.get('/', (req, res) => {
  res.send('Chat server running');
});
app.get('/api/message',async (req, res) => {
    const params = req.query
    const senderId = params.senderId
    const receiverId = params.receiverId
    const message = await Message.find({$or:[{senderId:senderId,receiverId:receiverId},
                                            {senderId:receiverId,receiverId:senderId}]})
                                            .sort({createdAt:-1}).limit(20)
    if (message.length==0) {
      res.json({message:'no message'})
    }else{
      res.json( message );
    }
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

app.post('/api/addmessage',async (req,res) => {
  const body = req.body
  const id =body.id
  const reciverid = body.receiverId
  const user = await User.findById(id)
  user.message.push(reciverid)
  await user.save()
  // user 2 is the reciver person and user1 is whos calling
  const user2 = await User.findById(reciverid)
  user2.message.push(id)
  await user2.save()
  res.send(user)
})

app.get('/api/chats',async (req,res) => {
  const params = req.query
  const id = params.id
  const user = await User.findById(id)
  let respone = []
  for(let i=0;i<user.message.length;i++){
    const user1 = await User.findById(user.message[i])
    respone.push({name:user1.name,id:user.message[i]})
  }
  res.send(respone)
})


const PORT = 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
