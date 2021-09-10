define(['blackboard/canvas/Layer'],
function(Layer){

    var ToolLayer = function(viewModel){

      Object.setPrototypeOf(this, new Layer());
      this._layerId = 'tool-area';

      this.getLayerId = function(){
        return this._layerId;
      }
      this.setupCanvas.call(this);
      this.getCurrentPosition = this.getCurrentPosition.bind(this);
      this._context.font = "39px Arial";
      this._context.fillStyle = "#828282";
      this._context.zIndex = "5";


      this.drawEraserCircle = function(radius, point){
        var cPoint = this.normalizedToCanvasCoordinates(point);
        var screenRadius = radius * this.getCanvas().width;
        var initialAngle = 0;
        var terminalAngle = 2 * Math.PI;
        this.clear();
        this._context.lineWidth   = "4";
        this._context.strokeStyle = "#dfffff";
        this._context.beginPath();
        this._context.arc(cPoint.x, cPoint.y, screenRadius, initialAngle, terminalAngle);
        this._context.stroke();
      }

      this.drawFriendsCursor = function(point){
        var url = './assets/cursor_friend_small.png';
        this.drawImage(point, 0, url);
      }

      this.drawFriendLeftMarker = function(y){
        var canvasHeight = this._canvas.height;
        var y = y * canvasHeight;
        var left = 20; // pixels.
        this.clear();
        this._context.fillText("<- Friend",  left, y);
      }

      this.drawFriendRightMarker = function(y){
        var canvasHeight = this._canvas.height;
        var y = y * canvasHeight;
        var right = 180;
        this.clear();
        this._context.fillText("Friend ->", this._canvas.width - right, y);
      }

      this.drawFriendsPencil = (function(line){
          var point = {x:line.x0,y:line.y0}
          var url = './assets/friends_pencil.png';
          var verticalOffset = -67;
          this.drawImage(point, verticalOffset, url);
      }).bind(this)


      this.drawFriendsEraser = function(point){
        var url = './assets/eraser_friend.png';
        var verticalOffset = -45;
        this.drawImage(point, verticalOffset, url);
        // this.drawEraserCircle(radius, point);
      }

      this.drawImage = function(point, yOffset, imgURL){
        var image = new Image();
        image.src = imgURL;
        var canvasPoint = this.normalizedToCanvasCoordinates(point);
        var x = canvasPoint.x;
        var y = canvasPoint.y;
        this.clear();
        this.getContext().drawImage(image,x,y + yOffset);
      }






    }
    return ToolLayer;
});
