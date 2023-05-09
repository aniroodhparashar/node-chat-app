const socket = io()

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = document.querySelector('input');
const $messageFormButton =  document.querySelector('button');
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

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

