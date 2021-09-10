
define(['blackboard/canvas/DrawingLayer',
         'blackboard/models/Line',
          'blackboard/models/RemoteErase'],
function(DrawingLayer, Line, RemoteErase){

    describe("Test DrawingLayer",() => {

        beforeEach(()=>{
          sut = new DrawingLayer();
        })

        it('getLayerId() == drawing-area',()=>{
          expect(sut.getLayerId()).toBe('drawing-area');
        })

        it('drawBoard([[{point}]]) => eraseArea(radius,point)',()=>{
          spyOn(sut,'eraseArea');
          sut.drawEntireBoard( [RemoteErase.getFake()]);
          expect(sut.eraseArea).toHaveBeenCalled();
        })


        it('drawBoard([[point1,  point2]]) => drawLine(point, point)',()=>{
          spyOn(sut,'drawLine');
          const lines = [Line.getFake()]
          sut.drawEntireBoard(lines);
          expect(sut.drawLine).toHaveBeenCalled();
        })


        it('drawLine() does just that.', ()=>{
          spyOn(sut._context,'stroke');
          const line = Line.getFake()
          sut.drawLine(line);
          expect(sut._context.stroke).toHaveBeenCalled();
        })


        it('drawLine() can also change the color if its there.', ()=>{
          const line = Line.getFake()
          sut.drawLine(line);
          expect(sut._context.strokeStyle).toBe(Line.WHITE)
        })


        it('drawLine()  defaults to white if no color is present.', ()=>{
          spyOn(sut._context,'stroke');
          const line = Line.getFake()
          sut.drawLine(line);
          expect(sut._context.stroke).toHaveBeenCalled();
          expect(sut._context.strokeStyle).toBe(Line.getDefaultColor())
        })


        it('eraserArea() => drawingLayer.eraseArea()', ()=>{
          let context = sut.getContext();
          spyOn(context,'arc');
          const erase = RemoteErase.getFake()
          sut.eraseArea(erase);
          expect(context.arc).toHaveBeenCalled();
        })

     })
   })
