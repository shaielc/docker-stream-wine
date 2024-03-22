let promise = null;
console.log(typeof io, (typeof io) === 'undefined')
var url = null
if (typeof io == 'undefined') {
    promise = import("socket.io-client")
    url = process.env.BACKEND_URL
} else {
    promise =new Promise((resolve) => resolve({io}));
    url = window.location.host
}

async function createClass({io}) {
    return class SignalingClient {
        constructor({
            answerClbk,
            candidateClbk,
            offerClbk,
            connectClbk,
            userJoinedClbk,
            resolutionClbk,
            token=null
        }) {
            console.log(url)
            const client_params = {
                transports: ['websocket', 'polling', 'flashsocket'],
                cors: {
                    origin: url,
                    credentials: true
                },
                withCredentials: true
            }
            if (token != null) {
                client_params.extraHeaders = {
                    cookie: token
                }
            }
            this.socket = io(url, client_params);
            this.socket.on("connect_error", (err) => {
                console.error("Connection failed due to:", err.message, url)          
            })
            this.socket.on('connect', () => {

                if (connectClbk) {connectClbk(this)}
            });

            this.socket.on("userJoined", (data) => {
                userJoinedClbk(data)
            })
            
            this.socket.on("room_users", (data) => {
            });

            this.socket.on("getOffer", (sdp) => {
                if(offerClbk) { offerClbk(sdp) }
            });
    
            this.socket.on("getAnswer", (sdp) => {
                answerClbk(sdp)
                
            });
            this.socket.on("getCandidate", candidateClbk)
            this.socket.on("getResolution",  resolutionClbk ?? (() => {}))
        }

        emitResolution(resolution) {
            this.socket.emit("resolution", resolution)
        }
    
        emitCandidate(candidate) {
            this.socket.emit("candidate", candidate);
        }
    
        emitOffer(sdp) {
            this.socket.emit("offer", sdp);
        }
    
        emitAnswer(sdp) {
            this.socket.emit("answer", sdp);
        }
        join(room) {
            this.socket.join(room)
        }

        isConnected() {
            this.socket.connected;
        }
    }    
}

export default await promise.then((io) => createClass(io))
