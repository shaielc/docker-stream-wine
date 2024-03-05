import SignalingClient from './signaling_client.js'

const pc_config = {
    bundlePolicy: "max-bundle"
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

class RTCConnection {
    constructor({trackClbk, resolutionClbk}) {
        
        this.pc = null
        
        this.signalingClient = new SignalingClient({
            answerClbk: (msg) => {
                console.log("answerClbk", msg)
                this.pc.setRemoteDescription( new RTCSessionDescription(msg) )
            },
            candidateClbk: (candidate) => {
                console.log("candidateClbk", candidate)
                this.pc.addIceCandidate( new RTCIceCandidate(candidate) ).then(() => {
                    console.log("candidate add success");
                });
            },
            connectClbk: (client) => {
                console.log("connectClbk")
            },
            offerClbk: (msg) => {
                console.log("offerClbk")
                this.createAnswer(msg)   
            },
            resolutionClbk
        })
        
        this.trackClbk = trackClbk
        this.controlChannel = null
        this.controlChannelCreatedClbk = null    
    }

    async createAnswer(sdp){
        this.pc = new RTCPeerConnection(pc_config);
        
        this.pc.onicegatheringstatechange = (e) => {
            if (this.pc.iceGatheringState === "complete") {
                console.log("Gathering completed")
                this.signalingClient.emitAnswer(
                    this.pc.localDescription
                )
                console.log("Creating control channel")
                this.createControlChannel()
            }
        }
        
        this.pc.ontrack = this.trackClbk
        await this.pc.setRemoteDescription(sdp)
        
        console.log("Set remote description success");
        
        let local_sdp = await this.pc.createAnswer({
                    offerToReceiveVideo: true,
                    offerToReceiveAudio: true,
                })

        console.log("Setting local sdp")
        this.pc.setLocalDescription(local_sdp);

        
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

export {RTCConnection}