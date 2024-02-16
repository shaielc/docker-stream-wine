import { RTCConnection } from "./webrtc_browser.js";
import { MouseEvents, EventSources } from './protocol.js'

function unmute(element) {
    element.muted = false;
}

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

const btnToMouseEvent = {
    0: MouseEvents.CLICK,
    2: MouseEvents.RIGHT_CLICK,
    1: MouseEvents.MIDDLE_CLICK

}

class Screen {
    constructor({target_element, targetHeight, targetWidth}) {
        this.targetHeight = targetHeight
        this.targetWidth = targetWidth
        this.target_element = document.getElementById(target_element);
        this.firstClick = false
        this.conn = null

        this.target_element.onclick = this.handleMouseClick
        
    }

    translatePosition = ev => {
        return {
            x: ev.offsetX / this.target_element.offsetWidth * this.targetWidth,
            y: ev.offsetY / this.target_element.offsetHeight * this.targetHeight
        }
    }

    handleMouseEvent = (ev, type, direction=null) => {
        const pos = this.translatePosition(ev)
        this.conn.sendCommand({"type": type, "x": pos.x, "y": pos.y, "source": EventSources.MOUSE, direction})
    }


    handleMouseMove =  (ev) => {
        this.handleMouseEvent(ev, MouseEvents.MOVE)
    }

    firstClickClbk = () => {
        this.conn = new RTCConnection({
            trackClbk: this.trackClbk
        });
        unmute(this.target_element)
        this.target_element.onmousemove = throttle(this.handleMouseMove, 10)
        this.target_element.oncontextmenu = this.handleMouseRightClick
        this.target_element.onmousedown = this.handleMouseDownEvent
        this.target_element.onmouseup = this.handleMouseUpEvent
        this.firstClick=true
    }

    handleMouseClick = (ev) => {
        if (!this.firstClick) {
            this.firstClickClbk()
        }
    }

    handleMouseDownEvent = (ev) => {
        this.handleMouseEvent(ev, btnToMouseEvent[ev.button], "down")
    }

    handleMouseUpEvent = (ev) => {
        this.handleMouseEvent(ev, btnToMouseEvent[ev.button], "up")
    }
    
    handleMouseRightClick = (ev) => {
        return false
    }

    trackClbk = (ev) => {
        this.target_element.srcObject = ev.streams[0]
    }

}

const screen = new Screen({target_element: "vidStream", targetHeight: 640, targetWidth: 800})
