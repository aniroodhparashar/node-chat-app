const socket = io()

//import {getUser } from '../../src/utils/users'

var typing=false;
var timeout=undefined;
var user=''

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = document.querySelector('#message-field');
const $messageFormButton =  document.querySelector('button');
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $loader = document.querySelector('#loader');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const imageTemplate = document.querySelector('#image-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const typingTemplate = document.querySelector('#typing-template').innerHTML


//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix : true })

const autoscroll = () =>{
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of last message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin


    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of message container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight


    if(containerHeight - newMessageHeight <= scrollOffset ){

        $messages.scrollTop = $messages.scrollHeight

    }

    console.log(newMessageHeight)
}


socket.on('message' , (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate,{

        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm A')    //
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(url) =>{
//console.log("here :",url)
    const html = Mustache.render(locationTemplate,{

        username:url.username,
        url:url.url,
        createdAt:moment(url.createdAt).format('h:mm A')    //

    })
    $messages.insertAdjacentHTML('beforeend',html)

    autoscroll()
})

socket.on('roomData',( { room, users } ) =>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')
    //disable
    const messageVal =e.target.elements.message.value

    socket.emit('sendMessage',messageVal, (error) =>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()

       if(error){
           return console.log(error)
       }
       console.log('message delivered')
    })
})


// socket.on('receiveMessage' , (message) => {
//     console.log(message)
//
//
//
//
//
// })


// socket.on('countUpdated', (count) =>{
//     console.log('Count has been updated',count)
// })
//
// document.querySelector('#increment').addEventListener('click',() =>{
//     console.log('clicked')
//     socket.emit('increment')
// })

$locationButton.addEventListener('click',() =>{


    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    $locationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition( (position) =>{
       console.log( position.coords.longitude)

        socket.emit('sendLocation', {
            longitude:position.coords.longitude,
            latitude:position.coords.latitude,
        }, (acknowledgement) =>{
            $locationButton.removeAttribute('disabled')
            console.log(`Locations is ${acknowledgement}`)
        })
    })
})

socket.emit('join', { username,room } , (error) =>{
    if(error){
        alert(error)

        location.href = '/'
    }
})


//read image and display loader
document.getElementById('file').addEventListener('change', function() {

    const reader = new FileReader();

    // Show the loader
    $loader.style.display = 'flex'
    reader.onerror = function() {
        $loader.style.display = 'none'
        console.log('Error loading image')
    }
    reader.onload = function() {
        const bytes = new Uint8Array(this.result)
        socket.emit('image', bytes);

    };
    console.log(this.files[0])
    if(this.files[0] ===undefined) {
        $loader.style.display = 'none'

    }
    reader.readAsArrayBuffer(this.files[0])




}, false);

//read image buffer and display on UI
socket.on('image', (message) => {
   // console.log(message)
    // create image with
    $loader.style.display = 'none';

    const img = new Image();
    // change image type to whatever you use, or detect it in the backend
    // and send it if you support multiple extensions
  //  console.log(message)



    img.src = `data:image/jpg;base64,${message.image}`;


    img.onload = function() {
        const html = Mustache.render(imageTemplate, {

            username: message.username,
            image: img.src,
            createdAt: moment(message.createdAt).format('h:mm A')    //
        })
        $messages.insertAdjacentHTML('beforeend',html)


        autoscroll()
    }

    img.onerror = function() {
        console.log('Error loading image');
    }

});

socket.on('userSet', (data)=> {
    user = data.username
    console.log(user)
})
/*Show typing indicator*/
$messageFormInput.addEventListener('keypress', function(e) {
     console.log("heeee ",user)
    // console.log(e.keyCode)
console.log(socket.id)
   // const user = getUser(socket.id)

    if(e.keyCode!==13){
        typing = true
        socket.emit('typing',{user:user,typing:true})
        clearTimeout(timeout)
        timeout=setTimeout(typingTimeout,1500)
    }else{

        clearTimeout(timeout)
        typingTimeout()
    }

    socket.on('display', (data)=>{
        console.log("here ",data)
        //console.log('this name ',data.username)
        if(data.data.typing==true) {
            document.querySelector('#typing').innerHTML =`${data.username} is typing...`


            autoscroll()
        }
        else {
            document.querySelector('#typing').innerHTML = ''
            autoscroll()
          //  $messages.insertAdjacentHTML('beforeend', document.querySelector('#typing').innerHTML)
        }
    })

})
function typingTimeout(){
    typing=false
    socket.emit('typing', {user:user, typing:false})
}

