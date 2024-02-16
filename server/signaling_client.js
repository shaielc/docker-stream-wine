let promise = null;
const url = "http://localhost:9001"
console.log(typeof io, (typeof io) === 'undefined')
if (typeof io == 'undefined') {
    promise = import("socket.io-client")
} else {
    promise =new Promise((resolve) => resolve({io}));
}

async function createClass({io}) {
    return class SignalingClient {
        constructor({
            answerClbk,
            candidateClbk,
            offerClbk,
            connectClbk,
            userJoinedClbk
        }) {
            this.socket = io(url, {
                transports: ['websocket', 'polling', 'flashsocket'],
                cors: {
                    origin: url,
                    credentials: true
                },
                withCredentials: true
            });
            
            // Signaling start
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
