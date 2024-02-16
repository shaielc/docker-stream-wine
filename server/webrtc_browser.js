import SignalingClient from './signaling_client.js'

const pc_config = {
    // iceServers: [
    //     {
    //         urls: "stun:stun.l.google.com:19302",
    //     },
    // ],
    bundlePolicy: "max-bundle"
};


class RTCConnection {
    constructor({trackClbk}) {
        
        this.pc = null
        
        this.signalingClient = new SignalingClient({
            answerClbk: (msg) => {
                console.log("answerClbk", msg)
                this.pc.setRemoteDescription( new RTCSessionDescription(msg) )
            },
            candidateClbk: (candidate) => {
                console.log("candidateClbk", candidate)
                this.pc.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
                    console.log("candidate add success");
                });
            },
            connectClbk: (client) => {
                console.log("connectClbk")
            },
            offerClbk: (msg) => {
                console.log("offerClbk")
                this.createAnswer(msg)   
            }
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
            }
        }
        this.pc.ontrack = this.trackClbk
        await this.pc.setRemoteDescription(sdp)
        console.log("set remote description success");
        let local_sdp = await this.pc.createAnswer({
                    offerToReceiveVideo: true,
                    offerToReceiveAudio: true,
                })
        console.log("set local sdp")
        this.pc.setLocalDescription(local_sdp);
        this.createControlChannel()
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
    
    sendCommand(command) {
        if (this.controlChannel == null){
            return
        }
        if (this.controlChannel.readyState === "closed") {
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