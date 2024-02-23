import SignalingClient from './signaling_client.js'
import nodeDataChannel from 'node-datachannel'
import { Video, Audio } from 'node-datachannel'
import { MouseEvents } from './protocol.js'
import robotjs from 'robotjs'
import net from 'net'
import { createSocket } from 'dgram'

robotjs.setMouseDelay(2)

class StreamConnection {
    constructor({port, protocol="udp"}) {
        this.listeners = {}
        this.listenerCount = 0;
        this.port = port
        this.client =  this.createClient(protocol)
        this.event_name = protocol == "tcp"? "data" : "message"
    }

    createClient(protocol) {
        if (protocol == "tcp") {
            return net.createConnection({port: this.port, host: "127.0.0.1"}, function () {console.log("Connected to gstream")})
        } else if ( protocol == "udp" ) {
            let client = createSocket("udp4")
            client.bind(this.port)
            return client
        }
    }
    
    addListener = (listener) => {
        this.client.on(this.event_name, listener)
        this.client.on("close", (had_error) => console.error('StreamSocket', had_error))
        this.listenerCount++;
        this.listeners[this.listenerCount] = listener;
        return this.listenerCount;
    };
    
    removeListener = (listener) => {
        this.client.removeListener("data", this.listeners[listener]);
    }
}

const videoConnection = new StreamConnection({port: 5000});
const audioConnection = new StreamConnection({port: 5001});

function createVideo(){
    let video = new Video('video', "SendOnly")
    video.addH264Codec(97)
    video.addSSRC(43, 'video-send')
    return video
}

function createAudio() {
    const audio = new Audio('audio', 'SendOnly')
    audio.addOpusCodec(96)
    audio.addSSRC(42, "audio-send")
    return audio
}

class PeerConnectionWrapper {
    constructor({provider, videoConnection, audioConnection}) {
        this.pc = new nodeDataChannel.PeerConnection('pc', { iceServers: [] })
        this.provider = provider
        this.offered = false

        this.pc.onGatheringStateChange((state) => {
            console.log("Provider: GatheringState -", state, this.pc.state())
            if (state === "complete") {
                console.log("Provider: Emit offer")
                this.emitOffer(provider)
            }
        });
        
        this.pc.onDataChannel((dc) => {
            this.controlChannel = dc
            dc.onMessage((msg) => {
                provider.controlChannelClbk(JSON.parse(msg))
            });
        });

        this.videoTrack = this.pc.addTrack(createVideo());
        this.listenerId = videoConnection.addListener((msg) => {
            if (this.videoTrack.isOpen()) {
                this.videoTrack.sendMessageBinary(msg)
            }
        })

        this.audioTrack = this.pc.addTrack(createAudio())
        this.listenerIdAudio = audioConnection.addListener((msg) =>{
            if (this.audioTrack.isOpen()) {
                this.audioTrack.sendMessageBinary(msg)
            }
        })
        this.controlChannel = this.pc.createDataChannel("Controller")
        this.pc.setLocalDescription()
        if (this.pc.gatheringState() === "complete") {
            this.emitOffer(this.provider);
        }
    }

    emitOffer(provider) {
        if (this.offered) {
            return
        }
        provider.signalingClient.emitOffer(this.pc.localDescription());
        this.offered = true
    }
}

class Provider {
    constructor() {
        this.signalingClient = new SignalingClient({
            answerClbk: this.answerClbk,
            candidateClbk: this.candidateClbk,
            userJoinedClbk: this.userJoinedClbk,
            connectClbk: this.connectClbk
        });
        
        this.wrapper = null;
    }
    connectClbk = () => {
        console.log("Provider", "Connected to Signaling")
    }

    userJoinedClbk = (msg) => {
        this.wrapper = new PeerConnectionWrapper({provider: this, audioConnection, videoConnection})
    }

    answerClbk = (msg) => {
        console.log("Provider: answerClbk")
        this.wrapper.pc.setRemoteDescription(msg.sdp, msg.type)    
    }

    candidateClbk = (candidate) => {
        console.log("Provider: candidateClbk")
        this.wrapper.pc.addRemoteCandidate(candidate.candidate, candidate.sdpMid)
    }

    offerClbk= (msg) =>  {
        console.log("Provier: offerClbk")
        if (this.wrapper != null) {
            this.discard()
        }
        this.wrapper = new PeerConnectionWrapper({provider: this, msg})
    }

    controlChannelClbk = (msg) => {
        robotjs.moveMouse(msg.x, msg.y)
        if (msg.type == MouseEvents.CLICK) {
            robotjs.mouseToggle(msg.direction, "left")
            return
        }
        else if(msg.type == MouseEvents.RIGHT_CLICK) {
            robotjs.mouseToggle(msg.direction, "right")
            return
        }
        else if (msg.type == MouseEvents.MIDDLE_CLICK) {
            robotjs.mouseToggle(msg.direction, "middle")
            return
        }
    }

    discard() {
        videoConnection.removeListener(this.listenerId)
    }
}

export {Provider}