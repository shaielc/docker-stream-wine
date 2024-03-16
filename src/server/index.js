import express from 'express';
import { Server } from 'socket.io'
import initSocketIO from './signaling.js'
import { authMiddleware, socketIOAuthMiddleware } from "./auth.js";
import session from "express-session";


var app = express();
const sessionMiddleware = session(
    {
        secret: process.env.EXPRESS_SESSION_SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.DEVELOPMENT ? true : false,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        }
    }
)
app.use(
    sessionMiddleware
)
app.use(authMiddleware)
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
io.engine.use(sessionMiddleware)
io.use(socketIOAuthMiddleware)

new initSocketIO(io)
console.log(`Stream App listening at http://localhost:${port}`)

process.on('uncaughtException', function (err) {
    console.log(err);
});