
define(['blackboard/canvas/Layer'],
function(Layer){

    describe("Test Layer",() => {

        beforeEach(()=>{
          sut = new Layer();
        })

        it('setupCanvas() throws if an incorrect id is used.', ()=>{
          let f = ()=>{
            let id = 'fakeid';
            spyOn(sut,'getLayerId').and.returnValue(id);
            sut.setupCanvas('_someCanvasName',id);
          }
          expect(f).toThrow(new Error('html template is missing canvas with id fakeid'));
        })

        it('getLayerId() throws', ()=>{
          let f = ()=>{
            sut.getLayerId();
          }
          expect(f).toThrow(new Error('cannot call abstract function.'));
        })


  

        it('getCurrentPosition() does just that.',()=>{
          spyOn(sut,'getLayerId').and.returnValue('drawing-area');
          let fakeEvent = {
            clientX:1,
            clientY:1
          }
          sut.setupCanvas();
          sut.setWidth(3);
          sut.setHeight(3);
          var point = sut.getCurrentPosition(fakeEvent);
          expect(!isNaN(point.x)).toBeTruthy();
          expect(!isNaN(point.y)).toBeTruthy();
        })

        it('getHeight() does just that.', ()=>{
          sut._canvas = {
            height:5
          }
          let height = sut.getHeight();
          expect(height).toBe(5);
        })


        it('getWidth() does just that.', ()=>{
          sut._canvas = {
            width:4
          }
          let width = sut.getWidth();
          expect(width).toBe(4);
        })
     })
   })
