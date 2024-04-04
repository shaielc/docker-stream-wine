import SignalingClient from '../common/signaling_client.js'

const pc_config = {
    bundlePolicy: "max-bundle",
    iceServers: [
        {
            urls: "stun:stun.relay.metered.ca:80",
        },
        {
            urls: "turn:standard.relay.metered.ca:80",
            username: "5e45fa421d26cd73ed0665da",
            credential: "3vCYdbKLnjry/X+G",
          },
    ]
};

function throttle(func, delay) {
    let prev = 0;
    return (...args) => {
        let now = new Date().getTime();
        if (now - prev > delay) {
            prev = now;
        }
        else { 
            return
        }
        return func(...args)
    }
}

const RTCStatus = {
    PENDING: 0,
    SIGNALING_CONNECTED: 1,
    PROVIDER_FOUND: 2,
    CONNECTION_INITIALIZED: 3,
    CONNECTING: 4,
    CONNECTED: 5,
    FAILED: -1,
    CLOSED: -2,
    VIDEO_VALID: 7

}

class RTCConnection {
    constructor({trackClbk, resolutionClbk, statusClbk}) {
        
        this.pc = null
        this.status = RTCStatus.PENDING
        this.completedGathering = false;
        this.remoteSdp = null;
        this.track = null;

        this.createPeerConnection();
        
        this.signalingClient = new SignalingClient({
            userJoinedClbk: (msg) => {
                console.log("userJoinedClbk", msg)
                this.updateStatus(RTCStatus.PROVIDER_FOUND)
            },
            answerClbk: (msg) => {
                console.log("answerClbk", msg)
                this.pc.setRemoteDescription( new RTCSessionDescription(msg))
            },
            candidateClbk: (candidate) => {
                console.log("candidateClbk", candidate)
                this.pc.addIceCandidate( new RTCIceCandidate(candidate) ).then(() => {
                    console.log("candidate add success");
                });
            },
            connectClbk: (client) => {
                console.log("connectClbk")
                this.updateStatus(RTCStatus.SIGNALING_CONNECTED)
            },
            offerClbk: (msg) => {
                console.log("offerClbk")
                this.remoteSdp = msg;
                this.pc.setRemoteDescription(this.remoteSdp).then(
                () => {
                    this.createAnswer()
                    this.updateStatus(RTCStatus.CONNECTION_INITIALIZED)
                }
                ).catch(console.error)
            },
            resolutionClbk
        })
        
        this.trackClbk = trackClbk
        this.statusClbk = statusClbk
        this.controlChannel = null
        this.controlChannelCreatedClbk = null    
    }

    updateStatus = (status) => {
        this.status = status
        if (this.statusClbk) {
            this.statusClbk(status)
        }
    }

    createPeerConnection() {
        this.pc = new RTCPeerConnection(pc_config);

        
        
        this.pc.onicegatheringstatechange = (e) => {
            if (this.pc.iceGatheringState === "complete") {
                console.log("Gathering completed")
                this.completedGathering = true;
                
                this.signalingClient.emitAnswer(
                    this.pc.localDescription
                )
            }
        }

        this.pc.onconnectionstatechange = (e) => {
            switch (this.pc.connectionState ) {
                case "connected":
                    console.log("Creating control channel")
                    this.trackClbk(this.track)
                    this.createControlChannel()
                    this.updateStatus(RTCStatus.CONNECTED)
                    break
                case "connecting":
                    this.updateStatus(RTCStatus.CONNECTING)
                    break
                case "failed":
                    this.updateStatus(RTCStatus.FAILED)
                    break
                case "closed":
                    this.updateStatus(RTCStatus.CLOSED)
                    break;
            }
        }

        this.pc.ontrack = (track) => {
            console.log("TRACK", track)
            this.track = track
            console.log(this, this.track)
        };
    }

    async createAnswer(){
        console.log(this.remoteSdp, this.completedGathering)
        if (this.remoteSdp === null) {
            return
        }
        
        console.log("Set remote description success");
        let local_sdp = await this.pc.createAnswer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: true,
        })

        console.log("Setting local sdp")
        await this.pc.setLocalDescription(local_sdp);
    };

    createControlChannel() {
        if (this.controlChannel != null) {
            return
        }
        console.log("Opening Control Channel")
        let controlChannel = this.pc.createDataChannel("Controller");
        
        controlChannel.addEventListener(
            "open",
            (event) =>{
                console.log("Control channel opened")
                this.controlChannel = controlChannel;
                if (this.controlChannelCreatedClbk) {
                    this.controlChannelCreatedClbk(this.controlChannel);
                }
        })
    }
    
    sendCommand = (command) => {
        if (this.controlChannel == null){
            return
        }
        if (this.controlChannel.readyState === "closed") {
            console.log("Control channel closed restarting")
            this.controlChannel = null;
            this.createControlChannel();
            return
        }
        if (this.controlChannel.readyState !== "open"){
            return
        }
        this.controlChannel.send(JSON.stringify(command));
    }

    handleControlChannelOpen(clbk) {
        if (this.controlChannel != null) {
            clbk(this.controlChannel)
        }
        this.controlChannelCreatedClbk = clbk
    }

}

export {RTCConnection, RTCStatus}