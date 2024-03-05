let promise = null;
console.log(typeof io, (typeof io) === 'undefined')
var url = null
if (typeof io == 'undefined') {
    promise = import("socket.io-client")
    url = "http://localhost:9001"
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
        }) {
            this.socket = io(url, {
                transports: ['websocket', 'polling', 'flashsocket'],
                cors: {
                    origin: url,
                    credentials: true
                },
                withCredentials: true
            });
            
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
    }    
}

export default await promise.then((io) => createClass(io))
