import { RTCConnection } from "./webrtc_browser.js";
import { MouseEvents, EventSources } from './protocol.js'

function unmute(element) {
    element.muted = false;
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

        this.target_element.addEventListener("click", this.handleMouseClick)
        
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
        this.target_element.addEventListener("mousemove", this.handleMouseMove)
        this.target_element.addEventListener("contextmenu", this.handleContext)
        this.target_element.addEventListener("pointerdown",this.handlePointerDown)
        this.target_element.addEventListener("pointerup", this.handlePointerUp)
        this.firstClick=true
        this.touching = false;
        this.long_press = false;
    }

    handleMouseClick = (ev) => {
        if (!this.firstClick) {
            this.firstClickClbk()
        }
    }

    handleTouchDown  = (ev) => {
        this.touching = true;
        this.long_press = false;
        setTimeout(() => this.handleLongPress(ev), 100)
    }

    handleLongPress = (ev) => {
        console.log("Long Press")
        if (this.touching) {
            this.long_press = true
            this.handleMouseEvent(ev, MouseEvents.RIGHT_CLICK, "down")
        }
    }

    handleTouchUp = (ev) => { 
        if (this.long_press) {
            this.handleMouseEvent(ev, MouseEvents.RIGHT_CLICK, "up")
        }
        else {
            this.handleMouseEvent(ev, MouseEvents.CLICK, "down")
            this.handleMouseEvent(ev, MouseEvents.CLICK, "up")
        }
        this.touching = false;
        this.long_press = false;
    }

    handlePointerDown = (ev) => {
        if (ev.pointerType == "mouse") {
            this.handleMouseDownEvent(ev)
        }
        else if (ev.pointerType == "touch") {
            this.handleTouchDown(ev)
        }
    }
    handlePointerUp = (ev) => {
        if (ev.pointerType == "mouse") {
            this.handleMouseUpEvent(ev)
        }
        else if (ev.pointerType == "touch") {
            this.handleTouchUp(ev)
        }
    }

    handleMouseDownEvent = (ev) => {
        this.handleMouseEvent(ev, btnToMouseEvent[ev.button], "down")
    }

    handleMouseUpEvent = (ev) => {
        this.handleMouseEvent(ev, btnToMouseEvent[ev.button], "up")
    }
    
    handleContext = (ev) => {
        ev.preventDefault()
        return false
    }

    trackClbk = (ev) => {
        this.target_element.srcObject = ev.streams[0]
    }

}

class Containter {
    constructor({element_id, borderWidth}) {
        this.element = document.getElementById(element_id)
        this.borderWidth = parseInt(getComputedStyle(this.element).borderWidth,10)
        
        this.element.style.borderWidth = this.borderWidth + "px"

        this.draggingX = false
        this.draggingY = false
        this.startHeight = null
        this.startWidth = null

        this.dragDirectionX = null
        this.dragDirectionY
        this.draggingStartPosition = null

        this.element.addEventListener("pointerdown", this.startDrag);
        document.addEventListener("pointermove", this.drag);
        document.addEventListener("pointerup", this.stopDrag);
        this.element.addEventListener("contextmenu", (ev) => {ev.preventDefault(); return false});
    }

    startDrag = (ev) => {
        let catchEvent = false
        if (ev.offsetX < this.borderWidth || this.element.offsetWidth - ev.offsetX - this.borderWidth  < this.borderWidth ) {
            this.draggingX = true
            this.startWidth = this.element.offsetWidth
            this.draggingStartPosition = {x: ev.clientX, y: ev.clientY}
            this.dragDirectionX = ev.offsetX < this.borderWidth ? -1 : 1
            catchEvent = true
        }
        
        if ( ev.offsetY < this.borderWidth || this.element.offsetHeight - ev.offsetY - this.borderWidth < this.borderWidth ) {
            this.draggingY = true
            this.startHeight = this.element.offsetHeight
            this.draggingStartPosition = {x: ev.clientX, y: ev.clientY}
            this.dragDirectionY = ev.offsetY < this.borderWidth ? -1 : 1
            catchEvent = true
        }
        if (catchEvent) {
            ev.preventDefault()
        }
        return !catchEvent
    }

    drag = (ev) => {
        let isDragging = false
        if (this.draggingX) {
            let dx = ev.clientX - this.draggingStartPosition.x            
            this.element.style.width = (this.startWidth + dx*2 * this.dragDirectionX) + "px";
            isDragging = true
        }
        if (this.draggingY) {
            let dy = ev.clientY - this.draggingStartPosition.y
            this.element.style.height = (this.startHeight + dy * 2 * this.dragDirectionY) + "px";
            isDragging = true
        }
        return !(isDragging)
    }

    stopDrag = (ev) => {
        if (this.draggingX || this.draggingY) {
            this.draggingX = false
            this.draggingY = false
            ev.preventDefault()
            return false
        }
    }
}

const screen = new Screen({target_element: "vidStream", targetHeight: 600, targetWidth: 800})
const container = new Containter({element_id: "draggable"})