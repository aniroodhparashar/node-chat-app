const path = require('path');
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage, generateImageMessage } = require('./utils/messages')
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users')
const fs = require('fs')
const sharp = require('sharp')



const app = express()

/*create server outside express library*/
const server = http.createServer(app)
const io = socketio(server,{
    maxHttpBufferSize: 1e9
})




const port = process.env.PORT || 3000
//Define paths for Express config
const publicPath = path.join(__dirname,'../public')

//Setup static directory to serve
app.use(express.static(publicPath))

//let count = 0

//server(emit) ->client(receive) - countUpdated -- acknowledgement ->server
//client(emit) ->server(receive) - increment -- acknowledgement ->client

/*on used for event getting*/
io.on('connection',(socket) => {
    console.log('New Websocket connection')

    socket.on('join', (options, callback) =>{
        const { error, user} =addUser({ id:socket.id,...options })


        if(error){
          return callback(error)
        }

        socket.join(user.room)

        const message = 'Welcome!!'
        socket.emit('message',generateMessage('Admin',message))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`))

        io.to(user.room).emit('roomData',{
            room: user.room,
            users:getUsersInRoom(user.room)
        })

        callback()

        //io.to.emit -- emits to everyone in a room , socket.boradcast.to.emit
    })

    socket.on('sendMessage', (message, callback) =>{

        const user = getUser(socket.id)
        const filter = new Filter()
//console.log(user.room);

        if(filter.isProfane(generateMessage('Admin',message))) {
            //socket.emit('countUpdated',count)\
            return callback('Profanity not allowed')
        }
           io.to(user.room).emit('message',generateMessage(user.username,message))
            callback()
        })




    socket.on('sendLocation',(location,callback) => {

        const user = getUser(socket.id)

//console.log(user['usernmae'])
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))

        callback('Shared')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))

            io.to(user.room).emit('roomData',{
                room: user.room,
                users:getUsersInRoom(user.room)
            })

        }
    })



    // socket.emit('countUpdated',count)
    //
    // socket.on('increment', () =>{
    //     count++
    //     //socket.emit('countUpdated',count)\
    //     io.emit('countUpdated',count)
    // })


    socket.on('image',  (image) => {
        // image is an array of bytes
        const user = getUser(socket.id)

        const buffer = Buffer.from(image,"base64");
        // const buffer = await sharp(image).resize({width:30,height:30}).png().toBuffer()
        console.log(buffer)
         fs.writeFile('/tmp/upload', buffer, (err) =>
             //err && console.error(err)

       {
            if(err){
                return console.error(err)
            }
            console.log('Image Uploaded')
        }
        ); // fs.promises

        // socket.emit('image', { image: true, buffer: buf.toString('base64') });
        io.to(user.room).emit('image',generateImageMessage(user.username, image.toString('base64'))) // image should be a buffer
    });


})


// app.get('',(req,res) => {
//     res.render('index',{
//
//     })
// })


server.listen(port, () =>{
    console.log('Server is up on port ' +port)
})

/*Chat libraries*/
//https://gist.github.com/andrewjmead/3e3e310aea27f10f7f1ce506b39dfcbe