const  { Server} = require("socket.io");
const cookie = require('cookie')
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model")
const aiService = require("../services/ai.service")
const messageModel = require('../models/message.model');
const {createMemory, queryMemory} = require("../services/vectore.service"); 

function initSocketServer(httpServer){

  const io = new Server(httpServer,{})

  // Authentication middleware
  io.use(async(socket,next)=>{
    //Converting String into Object
  const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
   if(!cookies.token){
   return next(new Error("Authentication error: NO token Provided"));
   }

   try{
   const decoded = jwt.verify(cookies.token,process.env.JWT_SECRET);
   const user = await userModel.findById(decoded.id);
   socket.user = user
   next();
   }catch(err){
 next(new Error("Authentication error: Invalid Token"));
   }
  })

    io.on("connection",(socket)=>{
        socket.on("ai-message",async (messagePayload)=>{
            console.log(messagePayload);


  const [ message, vectors] = await Promise.all([
    messageModel.create({
      chat: messagePayload.chat,
      user:socket.user._id,
      content: messagePayload.content,
      role: "user"
    }),
    aiService.generateVector(messagePayload.content),
  // Data is saved into vectore database

  ])
  await   createMemory({
    vectors,
    messageId: message._id,
    //message id should be unique
    metadata: {
      chat: messagePayload.chat,
      user: socket.user._id,
      text: messagePayload.content
    }
  })
   const [memory, chatHistoryRaw] = await Promise.all([
  queryMemory({
    queryVector: vectors,
    limit: 3,
    metadata: {
      user: socket.user._id
    }
  }),
  messageModel
    .find({ chat: messagePayload.chat }) 
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()
]);

// Reverse AFTER the query resolves
const chatHistory = chatHistoryRaw.reverse();

//last 20 message 
       const stm = chatHistory.map(item=>{
        return {
          role: item.role,
          parts: [{ text: item.content }]
        }
       })
       //retrive similar data from PineCone 
       const ltm = [
        {
          role: "user",
          parts: [ {text: `
            These are some previous message from the chat ,use them to generate a response 
             ${memory.map(item => item.metadata.text).join("\n")}
             `} ]
        }
       ]
       console.log(ltm[0])
       console.log(stm)
       //context give to model to give response 
const response = await aiService.generateResponse([...ltm, ...stm]);

       
       //Ai response emitted to client
            socket.emit('ai-response',{
                content: response,
                chat: messagePayload.chat
            })
            const [responseMessage,responseVectors] = await Promise.all([
        messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
         content: response,
          role: "model"
       }) ,
       aiService.generateVector(response)
       ])
       //Save Ai reply in Database
       await createMemory({
        vectors:responseVectors,
        messageId: responseMessage._id,
        metadata:{
          chat: messagePayload.chat,
          user: socket.user._id,
          text: response
        }
       })

        })
    })
}
module.exports = initSocketServer

// Flow of this code:
// 1. Message by user --> saved in MongoDB (message collection)
// 2. Message content --> converted into vector using aiService
// 3. Top 3 similar vectors --> retrieved from Pinecone (long-term memory)
// 4. Current message vector + metadata --> saved in Pinecone (long-term memory)
// 5. Last 20 chat messages --> fetched from MongoDB (short-term memory)
// 6. Short-term memory + Long-term memory --> combined and sent to AI model
// 7. AI generates response based on context
// 8. AI response --> saved in MongoDB
// 11. AI response --> emitted back to client for display
// 9. AI response --> converted into vector
// 10. AI response vector + metadata --> saved in Pinecone



//actual flow
//user message saved in Db --> generate vectore for user message -->query pinecon for related memories--> Save user message in pinecon --> Get chat history from the Db--> stm ,ltm --> generate response from the AI -->  save ai response in Db --> generate vecotor for Ai response --> save ai message in pinecone --> send ai response to user