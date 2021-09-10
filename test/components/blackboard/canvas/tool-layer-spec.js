
define(['blackboard/canvas/ToolLayer'],
function(ToolLayer){

    describe("Test ToolLayer",() => {

        beforeEach(()=>{
          sut = new ToolLayer();
        })

        it('getLayerId() does just that.', ()=>{
          let id = sut.getLayerId();
          expect(id).toBe(sut._layerId);
        })

        it('setupCanvas() does just that.', ()=>{
          let id = sut.getLayerId();
          sut.setupCanvas();
          let context = sut.getContext();
          expect(context.constructor.name).toBe('CanvasRenderingContext2D');
        })

        it('clear() calls clearRect() on the _context',()=>{
          sut.setupCanvas();
          let context = sut.getContext();
          spyOn(context,'clearRect');
          sut.clear();
          expect(context.clearRect).toHaveBeenCalled();
        })

        it('drawFriendLeftMarker(y) does just that.',()=>{
          let context = sut.getContext();
          spyOn(context,'fillText');
          let y = 0.5;
          sut.drawFriendLeftMarker(y);
          expect(context.fillText).toHaveBeenCalledWith(jasmine.any(String),20,75);
        })

        it('drawFriendRightMarker(y) does just that.', ()=>{
          let context = sut.getContext();
          spyOn(context,'fillText');
          let y = 0.5;
          sut.drawFriendRightMarker(y);
          expect(context.fillText).toHaveBeenCalledWith(jasmine.any(String),120,75);
        })

        it('drawFriendsPencil(point) => ',()=>{
          const point = {x:1, y:0.5};
          const context = sut.getContext();
          spyOn(context,'drawImage');
          sut.drawFriendsPencil(point);
          expect(context.drawImage).toHaveBeenCalled();
        })

        it('drawFriendsEraser(radius, point) does just that.', () => {
          let radius = 0.5;
          let point = {x:1,y:2};
          spyOn(sut,'drawImage');
          spyOn(sut,'drawEraserCircle');
          sut.drawFriendsEraser(radius, point);
          expect(sut.drawImage).toHaveBeenCalled();
        })

        it('drawFriendsCursor() => drawImage()',()=>{
          spyOn(sut,'drawImage');
          let p = {x:1,y:2};
          sut.drawFriendsCursor(p);
          expect(sut.drawImage).toHaveBeenCalled();
        })

        it('drawEraserCircle(radius, point) does just that.', ()=>{
          let context = sut.getContext();
          spyOn(context,'arc');
          let radi = 0.1;
          let point = {x:0.1, y:0.1};
          sut.drawEraserCircle(radi,point);
          expect(context.arc).toHaveBeenCalled();
        })


        it('normalizedToCanvasCoordinates()',()=>{

          spyOn(sut,'getCanvas').and.returnValue({width:2,height:3});
          let point = {
            x:1,
            y:1
          }
          let newPoint = sut.normalizedToCanvasCoordinates(point);
          expect(newPoint.x).toBe(2);
          expect(newPoint.y).toBe(3);
        })

     })
   })
