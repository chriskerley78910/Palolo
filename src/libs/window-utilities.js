define([], function(){

  var Window = function(){}


  /**
     If there an element is already full screen,
     then it makes it not full screen.
  **/
  Window.toggleFullscreen = function(elem) {
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(function(err){
        alert('Error attempting to enable full-screen mode: ' + err.message + ' ' + err.name);
      });
    } else {
      document.exitFullscreen();
    }
  }

  Window.attachResizer = function(element, resizer, options){

      if(!element || !resizer)
        throw new Error('elemen and resizer must be arguments.')

        var onMouseMove = function(event){
          event.preventDefault()
          var elementWidth = element.offsetWidth
          var centerPointX = elementWidth / 2
          var elementOffsetX = element.offsetLeft - centerPointX
          var elementOffsetY = element.offsetTop
          var mouseX = event.clientX
          var mouseY = event.clientY
          var newWidth = (mouseX - elementOffsetX)
          var newHeight = (mouseY - elementOffsetY)

          if(options){
            if(options['min-width'] < newWidth){
              element.style.width = newWidth + 'px'
            }
            if(options['min-height'] < newHeight){
              element.style.height = newHeight + 'px'
            }
          } else {
            element.style.width = newWidth + 'px'
            element.style.height = newHeight + 'px'
          }
        }

        resizer.addEventListener('mousedown', function(event){
          event.stopPropagation() // so draggin the div does not occur.
          document.addEventListener('mousemove',onMouseMove)
        })
        // dont resize anymore after the mouseup occurs.
        document.addEventListener('mouseup',function(){
          document.removeEventListener('mousemove',onMouseMove)
        })
  }



  Window.makeDragable = function(element){
    dragElement(element);
    // setDefaultPosition(element)
  }

  function setDefaultPosition(element){
    if(element){
      var percentFromTop = 0.2
      pos1 = (window.innerWidth / 2.)
      pos2 = percentFromTop * window.innerHeight
      element.style.left = (pos1) + "px";
      element.style.top = (pos2) + "px";
    }
  }

  function dragElement(element) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if(!element){
      console.log('element does not exist!')
    }
    else if (document.getElementById(element.id + "header")) {
      // if present, the header is where you move the DIV from:
      document.getElementById(element.id + "header").onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      element.onmousedown = dragMouseDown;
      element.ontouchstart = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.ontouchend = closeDragElement;

      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
      document.ontouchmove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.ontouchend = null;

      document.onmousemove = null;
      document.ontouchmove = null;
    }
  }

return Window;
});
