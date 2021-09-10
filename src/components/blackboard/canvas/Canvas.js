define(['blackboard/canvas/ToolLayer',
        'blackboard/canvas/DrawingLayer',
        'blackboard/models/Line',
        'window-utilities'],
  function(ToolLayer,
           DrawingLayer,
           Line,
           WindowUtils){

    var Canvas = function(viewModel){

      if(!viewModel || typeof viewModel.setMyCursorPosition != 'function'){
        throw new Error('Canvas must have a board collection injected.');
      }
      this.viewModel = viewModel;
      this.toolLayer = new ToolLayer();
      this.drawingLayer = new DrawingLayer();
      this._drawingCanvas = this.drawingLayer.getCanvas();

      this.HIDEABLE_AREA_ID = 'hideable-area'
      this.mouseDown = false;
      this.LEFT_MOUSE_BUTTON = 0;
      this.RIGHT_MOUSE_BUTTON = 2;


      this.initialize = function(){
        var $b = $('#blackboard-fullscreen-button')
        this._hideableArea = document.getElementById(this.HIDEABLE_AREA_ID);
        $b.on('click',this.makeFullScreen)
        $(window).on('resize',this.resizeBlackboard);
        this.initMouseListeners();
      }

      this.makeFullScreen = (function(){
        WindowUtils.toggleFullscreen(this._hideableArea)
      }).bind(this)


      this.clear = function(){
        this.toolLayer.clear();
      }
      this.clear = this.clear.bind(this);

      this.mouseMoveHandler = (function(e){
        var currentPosition = this.drawingLayer.getCurrentPosition(e);

        var tool = this.viewModel.getMyCurrentTool();
        this.toolLayer.clear();

        if(tool == 'cursor'){
          this.viewModel.setMyCursorPosition(currentPosition);
        }
        else if(tool == 'eraser'){
          var radius = this.viewModel.ERASER_RADIUS;
          this.drawEraserCircle(radius, currentPosition);
          if(this.mouseDown == false){
             this.viewModel.setMyEraserPosition(currentPosition);
          }else{
            this.viewModel.setMyEraserDown(currentPosition);
            this.viewModel.startSaveCountDown();
          }
        }
        else if(tool == 'pencil'){

          if(this.mouseDown == false){
            this.viewModel.setMyPencilPosition(currentPosition);
          }
          else{

            this.possiblyDrawLine(currentPosition);
          }
        }
      }).bind(this)


      /**
       * Only does a draw line request if the first point
       * of the line has been set.
       * @param  {[type]} currentMousePosition
       */
      this.possiblyDrawLine = (function(currentMousePosition){
        if(!currentMousePosition){
          throw new Error('currentMousePosition must be an object with a x and y coordinate.');
        }
        if(!this.previousPosition){
          this.previousPosition = currentMousePosition;
        } else {
          this.viewModel.startSaveCountDown();
          var x0 = this.previousPosition.x
          var y0 = this.previousPosition.y
          var x1 = currentMousePosition.x
          var y1 = currentMousePosition.y
          var raw = {kind:'line',x0:x0,y0:y0,x1:x1,y1:y1}
          var l = new Line(raw)
          this.viewModel.setMyPencilLine(l);
          this.previousPosition = currentMousePosition;
        }
      }).bind(this)




      this.mouseDownHandler = function(event){
        this.mouseDown = true;
        if(event.button == this.RIGHT_MOUSE_BUTTON){
          this.viewModel.setEraserTool();
        }
      }
      this.mouseDownHandler = this.mouseDownHandler.bind(this);


      this.mouseUpHandler = function(event){
        this.mouseDown = false;
        this.previousPosition = null;
        if(event.button == this.RIGHT_MOUSE_BUTTON){
          this.viewModel.setPencilTool();
        }
      }
      this.mouseUpHandler = this.mouseUpHandler.bind(this);

      /**
       * ensures that the tool does not "stick" down
       * when the users cursor leaves the black board.
       *
       * @param  {object} event
       */
      this.mouseLeaveHandler = function(event){

        if(this.mouseDown){
          var currentPosition = this.drawingLayer.getCurrentPosition(event);
          var tool = this.viewModel.getMyCurrentTool();

          if(tool == 'pencil'){
            this.mouseDown = false;
            this.possiblyDrawLine(currentPosition);
          }
          else if(tool == 'eraser'){
            this.mouseDown = false;
          }
          this.previousPosition = null;
        }
      }
      this.mouseLeaveHandler = this.mouseLeaveHandler.bind(this);

      /**
       * Absolutely needed to prevent accidentally draging items on the screen
       * when the user drags the the tool off from the board.
       * @param  {object} e event
       */
      this.dragStartHandler = function(e){
        e.preventDefault();
      }
      this.dragStartHandler = this.dragStartHandler.bind(this);


      this.initMouseListeners = function(){
        this._drawingCanvas.onmousemove = this.mouseMoveHandler;
        this._drawingCanvas.onmousedown = this.mouseDownHandler;
        this._drawingCanvas.onmouseup = this.mouseUpHandler;
        this._drawingCanvas.onmouseleave = this.mouseLeaveHandler;
        this._drawingCanvas.ondragstart = this.dragStartHandler;

      }
      this.initMouseListeners = this.initMouseListeners.bind(this);


      this.setMyToolToPencil = function(){
        this._drawingCanvas.style.cursor = "url('./assets/my_pencil.cur') 0 45,auto";
      }

      this.setMyToolToEraser = function(){
        this._drawingCanvas.style.cursor = "url('./assets/eraser_my.cur') 0 45,auto";
      }


      this.drawFriendsCursor = function(update){
          this.toolLayer.drawFriendsCursor(update.position);
      }
      this.drawFriendsCursor = this.drawFriendsCursor.bind(this);

      this.drawFriendsEraser = (function(erase){

        this.toolLayer.drawFriendsEraser(erase);
      }).bind(this)

      this.drawFriendsPencil = (function(pencil){
        this.toolLayer.drawFriendsPencil(pencil);
      }).bind(this)

      this.drawMyPencilLine = function(line){
        this.drawLine(line);
      }

      this.drawFriendsPencilLine = function(line){
        this.drawLine(line);
        this.drawFriendsPencil(line);
      }

      this.friendEraseArea = (function(erase){
        this.drawFriendsEraser(erase);
        this.eraseArea(erase);
      }).bind(this)


      this.getPNG = function(){
        return this.drawingLayer.getPNG()
      }


      this.eraseArea = (function(erase){
        this.drawingLayer.eraseArea(erase);
      }).bind(this)


      this.drawEraserCircle = function(radius, point){
        this.toolLayer.drawEraserCircle(radius, point);
      }

      this.drawFriendLeftMarker = function(y){
        this.toolLayer.drawFriendLeftMarker(y);
      }

      this.drawFriendRightMarker = function(y){
        this.toolLayer.drawFriendRightMarker(y);
      }

      this.resizeBlackboard = function(){
        var ASPECT_RATIO = 1.777777778;  // 16:9 ratio.
        var $hideableArea = $(this._hideableArea);
        var newHeight = $hideableArea.width() / ASPECT_RATIO;
        this.drawingLayer.setHeight(newHeight);
        this.toolLayer.setHeight(newHeight);
      }
      this.resizeBlackboard = this.resizeBlackboard.bind(this);

      /**
       * show the given board.
       */
      this.drawEntireBoard = function(commands){
        this.drawingLayer.drawEntireBoard(commands);
      }

      this.drawOntoBoard = function(commands){
        this.drawingLayer.drawOntoBoard(commands)
      }

      this.drawLine = (function(line){
        this.drawingLayer.drawLine(line);
      }).bind(this)


    }
    return Canvas;
});
