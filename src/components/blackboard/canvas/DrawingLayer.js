define(['blackboard/canvas/Layer'],
function(Layer){

    var DrawingLayer = function(){

      Object.setPrototypeOf(this, new Layer());
      this._layerId = 'drawing-area';

      this.getLayerId = function(){
        return this._layerId;
      }
      // ensures that 'this' in setupCanvas refers to this DrawingLayer.
      // and that _context and _cavas are visible in this Layer.
      this.setupCanvas.call(this);
      this.getCurrentPosition = this.getCurrentPosition.bind(this);
      this.getCanvas().oncontextmenu = function(){
        return false;
      }

      this.getPNG = function(){
        return document.getElementById(this.getLayerId()).toDataURL('image/png')
      }

      this.drawOntoBoard = function(commands){
        this._context.lineWidth   = "4";
        this._context.strokeStyle = this.getDefaultStroke()
        var data = commands;
        for(var i = 0; i < data.length; i++){
          var e = data[i]
          if(!e || !e.isLine){
            throw new Error('Unrecognized command:' + e)
          }else if(!e.isLine()){
            this.eraseArea(e);
          }else if(e.isLine()){
            this.drawLine(e);
          } else {
            throw new Error('Unrecognized command:' + e)
          }
        } // end loop.
      }

      this.drawEntireBoard = function(commands){
        this.clear();
        this.drawOntoBoard(commands)
      }

      this.eraseArea = function(erase){
        this._context.beginPath();
        var startAngle = 0;
        var endAngle = 2 * Math.PI;
        var p = this.normalizedToCanvasCoordinates(erase);
        var screenRadius = erase.getRad() * this.getWidth();
        this._context.arc(p.x, p.y, screenRadius, startAngle, endAngle);
        this._context.fillStyle = 'black';
        this._context.fill();
      }

      /**
        Draws a single line. i.e two points
        and a line between them.
      **/
      this.drawLine = function(line){
        var color = line.getColor()
        this._context.strokeStyle = color
        var width = this.getWidth();
        var height = this.getHeight();
        this._context.beginPath();

        var startX = line.x0 * width;
        var startY = line.y0 * height;
        this._context.moveTo(startX, startY);

        var endX = line.x1 * width;
        var endY = line.y1 * height;
        this._context.lineTo(endX,endY);
        this._context.stroke();
      }



    }
    return DrawingLayer;
});
