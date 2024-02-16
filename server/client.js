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

class Containter {
    constructor({element_id, borderWidth}) {
        this.element = document.getElementById(element_id)
        this.borderWidth = borderWidth
        
        this.element.style.borderWidth = this.borderWidth + "px"

        this.draggingX = false
        this.draggingY = false
        this.startHeight = null
        this.startWidth = null

        this.dragDirectionX = null
        this.dragDirectionY
        this.draggingStartPosition = null
        
        this.element.onmousedown = this.startDrag
        document.onmousemove = this.drag
        document.onmouseup = this.stopDrag
    }

    startDrag = (ev) => {
        let catchEvent = false
        if (ev.offsetX < this.borderWidth || this.element.offsetWidth - ev.offsetX - this.borderWidth  < this.borderWidth ) {
            this.draggingX = true
            this.startWidth = this.element.offsetWidth
            this.draggingStartPosition = {x: ev.x, y: ev.y}
            this.dragDirectionX = ev.offsetX < this.borderWidth ? -1 : 1
            catchEvent = true
        }
        
        if ( ev.offsetY < this.borderWidth || this.element.offsetHeight - ev.offsetY - this.borderWidth < this.borderWidth ) {
            this.draggingY = true
            this.startHeight = this.element.offsetHeight
            this.draggingStartPosition = {x: ev.x, y: ev.y}
            this.dragDirectionY = ev.offsetY < this.borderWidth ? -1 : 1
            catchEvent = true
        }
        return !catchEvent
    }

    drag = (ev) => {
        if (this.draggingX) {
            let dx = ev.x - this.draggingStartPosition.x 
            this.element.style.width = (this.startWidth + dx*2 * this.dragDirectionX) + "px";
            return false
        }
        if (this.draggingY) {
            let dy = ev.y - this.draggingStartPosition.y
            this.element.style.height = (this.startHeight + dy * 2 * this.dragDirectionY) + "px";
            return false
        }
    }

    stopDrag = (ev) => {
        this.draggingX = false
        this.draggingY = false
        return false
    }
}

const screen = new Screen({target_element: "vidStream", targetHeight: 640, targetWidth: 800})
const container = new Containter({element_id: "draggable", borderWidth: 10})