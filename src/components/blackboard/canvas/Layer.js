define([],function(){

    var Context = function(viewModel){

      this.getDefaultStroke = function(){
        return '#ffffff'
      }

      this.setupCanvas = function(){
        var id = this.getLayerId();
        this._canvas = document.getElementById(id);
        if(!this._canvas){
          throw new Error('html template is missing canvas with id ' + id);
        }
        var $canvas = $(this._canvas);
        var tagName = $canvas.prop('tagName');
        if(tagName != 'CANVAS'){
          throw new Error("tag must be a canvas element");
        }
        this._context = this._canvas.getContext('2d');
      }

      this.getContext = function(){
        return this._context;
      }

      this.getCanvas = function(){
        return this._canvas;
      }

      this.clear = function(){
        if(!this._canvas)
          throw new Error('Canvas not set.');
        var w = this._canvas.width;
        var h = this._canvas.height;
        this._context.clearRect(0, 0, w, h);
      }

      this.getLayerId = function(){
        throw new Error('cannot call abstract function.');
      }

      this.normalizedToCanvasCoordinates = function(point){
        var width = this.getCanvas().width;
        var height = this.getCanvas().height;
        return {
          x:point.x * width,
          y:point.y * height
        }
      }

      this.getCurrentPosition = function(e){
        var leftOffset = $(this._canvas).offset().left;
        var topOffset = $(this._canvas).offset().top;
        var width = $(this._canvas).width();
        var height = $(this._canvas).height();
        return {
                    x: (e.clientX - leftOffset) / width,
                    y: (e.clientY - topOffset) / height
                }
      }


      this.getHeight = function(){
        return this._canvas.height;
      }

      this.setHeight = function(height){
        if(!height){
          // console.warn('height must be a positive number.')
          return;
        }
        this._canvas.style.height = height + 'px';
      }

      this.getWidth = function(){
        return this._canvas.width;
      }

      this.setWidth = function(width){
        this._canvas.style.width = width + 'px';
      }


      

    }
    return Context;
});
