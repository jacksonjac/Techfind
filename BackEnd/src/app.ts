
import helmet from 'helmet';
import connectDB from '../Config/Db.connect';
import config from '../Config/Config';
import serverConfig from './server';
import dependencies from './Framework/Confiq/Dependencies';
import { routes } from './Adaptors/Routers';
import { Server as SocketIOServer } from 'socket.io';
import cloudinary from './Adaptors/Utilities/CloudinaryFn';
import * as http from 'http';
import * as https from 'https';
import  express from 'express';
import * as bodyParser from 'body-parser';
import  cors from 'cors';
import * as dotenv from 'dotenv';
import session from 'express-session';
import { NotificationHandler } from './Application';
dotenv.config();
const appPass = process.env.APP_PASS;


connectDB(config);

const app = express();
const server = http.createServer(app);
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:4200', // Include the protocol (http://)
  credentials: true // Allow cookies to be sent
}));

app.use(helmet());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent JavaScript access to cookies
    sameSite: 'lax' // Adjust based on your cross-origin needs
  }
}));

app.use(express.json()); // for parsing application/json

app.use('/api', routes(dependencies));

serverConfig(server, config).startServer();

//socket configration start
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:4200', // Replace with your Angular app's URL
    methods: ['GET', 'POST']
  }
});

const socketUsers = new Map();
const notificationUsers = new Map();
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('register', (id) => {
    console.log('User registered with id:', id);
    socketUsers.set(id, socket.id);
  });
  // socket.on('registerNotification', (id) => {
  //   console.log('User registered for notifications with id:', id);
  //   notificationUsers.set(id, socket.id);
  // });


  socket.on('message', async (chat, callback) => {
    try {
      const { senderId, text, receiverId } = chat.message;
      console.log('Received message:', chat.message);
  
      const { MessageHandler } = dependencies.useCase;
      const response = await MessageHandler(dependencies).executeFunction(chat);
      console.log(response);
  
      // Check if the message was successfully processed
      if (response.status) {
        // Determine the correct receiver ID based on the sender type
        let expectedReceiverId = '';
  
        // Assuming you have senderType in chat.message
        if (chat.message.SenderType === 'user') {
          expectedReceiverId = chat.message.receiverId; // If sender is user, receiver should be the technician
        } else if (chat.message.SenderType === 'technician') {
          expectedReceiverId = chat.message.receiverId; // If sender is technician, receiver should be the user
        }
  
        // Validate the receiver ID
        if (expectedReceiverId === receiverId) {
          const receiverSocketId = socketUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('Newmessage', response.data);
          }
          callback(response.data); // Pass the created message data to the callback
        } else {
          callback({ status: false, message: "Invalid receiver ID" });
        }
      } else {
        callback({ status: false, message: "Message could not be sent" });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      callback({ status: false, message: "An error occurred" });
    }
  });

  socket.on('seenmessage',async (data)=>{

    const { userid, viewedBy, techid } = data

    console.log('Received data', data);
      let receiversockeid 
    if(viewedBy === 'user'){
      receiversockeid = socketUsers.get(techid)
    }else{
      receiversockeid = socketUsers.get(userid)
    }

    console.log('recicferesokckeit ',receiversockeid)
    if(receiversockeid !== undefined){
      socket.to(receiversockeid).emit('seenmessage',data)
    }

  })



  // socket.on('notification', async (notificationData, callback) => {
  //   try {
  //     const { receiverId, content } = notificationData;
  //     console.log('Received notification:', notificationData);

  //     const { NotificationHandler } = dependencies.useCase;
  //     const response = await NotificationHandler(dependencies).executeFunction(notificationData);
  //     console.log(response);

  //     // Check if the notification was successfully processed
  //     if (response.status) {
  //       const receiverSocketId = notificationUsers.get(receiverId);
  //       if (receiverSocketId) {
  //         io.to(receiverSocketId).emit('NewNotification', response.data);
  //       }
  //       callback(response.data); // Pass the notification data to the callback
  //     } else {
  //       callback({ status: false, message: "Notification could not be sent" });
  //     }
  //   } catch (error) {
  //     console.error('Error handling notification:', error);
  //     callback({ status: false, message: "An error occurred" });
  //   }
  // });
  // socket.on('likeNotification', async (likeData, callback) => {
  //   try {
  //     const { userid, technicianId, content, date } = likeData;
  //     console.log('Received like notification:', likeData);

  //     const { NotificationHandler } = dependencies.useCase;
  //     const response = await NotificationHandler(dependencies).executeFunction(likeData);
  //     console.log(response,"this is sthe responce of the notfication handler");

  //     if (response.status) {
  //       const receiverSocketId = notificationUsers.get(technicianId);
  //       if (receiverSocketId) {
  //         io.to(receiverSocketId).emit('NewLikeNotification', response.data);
  //       }
  //       callback(response.status);
  //     } else {
  //       callback({ status: false, message: "Like notification could not be sent" });
  //     }
  //   } catch (error) {
  //     console.error('Error handling like notification:', error);
  //     callback({ status: false, message: "An error occurred" });
  //   }
  // });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    for (const [id, socketId] of socketUsers.entries()) {
      if (socketId === socket.id) {
        socketUsers.delete(id);
        break;
      }
    }
    for (const [id, socketId] of notificationUsers.entries()) {
      if (socketId === socket.id) {
        notificationUsers.delete(id);
        break;
      }
    }
  });
});

export { express };
