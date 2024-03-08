import express from 'express';
import {Server} from 'socket.io'
import initSocketIO from './signaling.js'

var app = express();
app.use(
    express.static(
        "../client/"
    )
)
app.use('/common',
    express.static("../common")
)
const port = 9001;  //change port number is required

//send the html page which holds the video tag
app.get('/', function (req, res) {
    res.redirect('index.html');
});

// app.get('/client.js', function (req, res) {
//     res.send('../client/client.js');
// });


//stop the connection
app.post('/stop', function (req, res) {
    console.log('Connection closed using /stop endpoint.');

    if (gstMuxer != undefined) {
        gstMuxer.kill();    //killing GStreamer Pipeline
        console.log(`After gstkill in connection`);
    }
    gstMuxer = undefined;
    res.end();
});


const server = app.listen(port);
const io = new Server(server);

new initSocketIO(io)
console.log(`Stream App listening at http://localhost:${port}`)

process.on('uncaughtException', function (err) {
    console.log(err);
});