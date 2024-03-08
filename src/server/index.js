import express from 'express';
import {Server} from 'socket.io'
import initSocketIO from './signaling.js'
import {Provider} from './provider.js'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// var child = require('child_process');

var app = express();
app.use(express.static(dirname(fileURLToPath(import.meta.url)) + "../client/"))
const port = 9001;  //change port number is required

//send the html page which holds the video tag
// app.get('/', function (req, res) {
//     res.send('index.html');
// });

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

// var client = udp.createSocket('udp4')
// client.bind(5001)

const listeners = {};
var listenerCount = 0;
//send the video stream
app.get('/stream', function (req, res) {

    res.writeHead(200, {
        'Content-Type': 'video/mp4',
    });
    console.log("stream connection")
    // var client = net.createConnection({port: 5001, host: "127.0.0.1"}, function () {console.log("Connected to gstream")})
    
    const dataProxy = (msg) => {
        console.log(msg)
        res.write(msg);
    }
    const removeListener =() => {
        client.removeListener('message', dataProxy);
        client.removeListener('data', dataProxy);
    }
    
    
    client.on('message', dataProxy );
    client.on('data', dataProxy);
    client.on('close', (had_error) => {
        console.log('Socket closed.');
        if (had_error) {
            console.error(had_error)
        }
        res.end();
        removeListener()
    });
    req.on("close",() => {
        console.log("Client disconnected from stream")
        removeListener();
    })
});

const server = app.listen(port);
const io = new Server(server);
const provider = new Provider();

new initSocketIO(io)
console.log(`Stream App listening at http://localhost:${port}`)

process.on('uncaughtException', function (err) {
    console.log(err);
});