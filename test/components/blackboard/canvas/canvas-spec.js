
define(['blackboard/canvas/Canvas',
        'blackboard/ViewModel',
        'blackboard/models/Line'],
function(Canvas,ViewModel, Line){

    var canvas = null;
    let selectedFriendId = null;
    let vm = null;
    describe("Test Canvas",() => {

      beforeEach(() => {
        vm = new ViewModel.viewModel();
        selectedFriendId = vm.selectedclassmateId;
        canvas = new Canvas(vm);
      })

      it('Canvas(null) throws',()=>{
        expect(()=>{new Canvas(null)}).toThrow(new Error('Canvas must have a board collection injected.'));
      })

      it('has viewModel as an attribute', ()=>{
        expect(typeof canvas.viewModel == 'object').toBeTruthy();
        expect(canvas.toolLayer).toBeDefined();
        expect(canvas.drawingLayer).toBeDefined();
      })



      it('initialize() => initMouseListener()', ()=>{
        spyOn(canvas,'initMouseListeners');
        canvas.initialize();
        expect(canvas.initMouseListeners).toHaveBeenCalled();
        expect(canvas._drawingCanvas).toBeDefined();
      })

     it('clear() => toolLayer.clear()', ()=>{
       spyOn(canvas.toolLayer,'clear');
       canvas.clear();
       expect(canvas.toolLayer.clear).toHaveBeenCalled();
     })


     it('mousemove, mouseup, mousedown all have handlers attached',()=>{
       canvas.initialize();
       expect(canvas._drawingCanvas.onmousemove).toBe(canvas.mouseMoveHandler);
       expect(canvas._drawingCanvas.onmousedown).toBe(canvas.mouseDownHandler);
       expect(canvas._drawingCanvas.onmouseup).toBe(canvas.mouseUpHandler);
       expect(canvas._drawingCanvas.ondragstart).toBe(canvas.dragStartHandler);
     })

     it('mouseDownHandler(right button down) => viewModel.setEraserTool()', () => {
       spyOn(canvas.viewModel,'setEraserTool');
       let event = {
         button:2
       }
       canvas.mouseDownHandler(event);
       expect(canvas.viewModel.setEraserTool).toHaveBeenCalled();
     })

     it('mouseUpHandler(right button up) => viewModel.setPencilTool()', () => {
       spyOn(canvas.viewModel,'setPencilTool');
       let event = {
         button:2
       }
       canvas.mouseUpHandler(event);
       expect(canvas.viewModel.setPencilTool).toHaveBeenCalled();
     })





     it('dragStartHandler(e) calles preventDefault() on e.',()=>{
       let spy = {
         preventDefault:()=>{

         }
       }
       spyOn(spy,'preventDefault');
       canvas.dragStartHandler(spy);
       expect(spy.preventDefault).toHaveBeenCalled();
     })


     it('onMouseMoveHandler() => ViewModel.setMyPencilLine(line)', ()=>{

       canvas.initialize();
       spyOn(canvas.drawingLayer,'getCurrentPosition').and.returnValue({x:1,y:2});
       spyOn(canvas.viewModel,'setMyPencilLine');
       spyOn(canvas.viewModel,'getMyCurrentTool').and.returnValue('pencil');
       spyOn(canvas.viewModel,'startSaveCountDown');
       canvas.mouseDown = true;
       canvas.previousPosition = {x:1,y:2};
       const e = {
         clientX:1,
         clientY:1
       }
       canvas.mouseMoveHandler(e);

       expect(canvas.viewModel.setMyPencilLine).toHaveBeenCalled();
       expect(canvas.viewModel.startSaveCountDown).toHaveBeenCalled();
     })

     it('mouseMoveHandler() ^ mouseDown and tool == eraser => ',()=>{

     })


     it('tool == pencil ^ mousedown ^ mouseUpHandler() => vm.startSaveCountDown()',()=>{
       spyOn(canvas.viewModel,'getMyCurrentTool').and.returnValue('pencil');
       canvas.mouseDown = true;
       canvas.mouseUpHandler({button:0});
       expect(canvas.previousPosition).toBeNull();
     })

     it(`mouseMoveHandler()
       ^ tool == eraser
       ^ mouseDown == false
       => setMyEraserPosition()`, ()=>{
         canvas.initialize();
         spyOn(canvas.viewModel,'setMyEraserPosition');
         let point = {x:0.4,y:0.6};
         spyOn(canvas.drawingLayer,'getCurrentPosition').and.returnValue(point);
         spyOn(canvas.viewModel,'getMyCurrentTool').and.returnValue('eraser');
         canvas.mouseDown = false;
         canvas.viewModel._currentTool = 'eraser';
         canvas.mouseMoveHandler({});
         expect(canvas.viewModel.setMyEraserPosition).toHaveBeenCalledWith(point);
       })


      it(`mouseMoveHandler()
        ^ tool == eraser
        ^ mouseDown == true
       => setMyEraserDown(point)`, ()=>{

        let point = {x:0,y:1}
        canvas.initialize();
        spyOn(canvas.drawingLayer,'getCurrentPosition').and.returnValue(point);
        spyOn(canvas.viewModel,'getMyCurrentTool').and.returnValue('eraser');
        spyOn(canvas.viewModel,'setMyEraserDown');
        spyOn(canvas.viewModel,'startSaveCountDown');
        canvas.mouseDown = true;
        canvas.mouseMoveHandler({});
        expect(canvas.viewModel.setMyEraserDown).toHaveBeenCalledWith(point);
        expect(canvas.viewModel.startSaveCountDown).toHaveBeenCalled();
      })

    let mockCanvases = () =>{
      canvas._drawingCanvas ={
        width:5,
        height:6,
      }
      canvas._drawingContext = {
        clearRect:()=>{},
        beginPath:()=>{},
        stroke:()=>{}
      }
    }


    it('drawEntireBoard() => drawingLayer.drawEntireBoard()', ()=>{
      spyOn(canvas.drawingLayer,'drawEntireBoard');
      canvas.drawEntireBoard(null);
      expect(canvas.drawingLayer.drawEntireBoard).toHaveBeenCalled();
    })

    it('drawOntoBoard() => drawingLayer.drawOntoBoard()', ()=>{
      spyOn(canvas.drawingLayer,'drawOntoBoard');
      canvas.drawOntoBoard(null);
      expect(canvas.drawingLayer.drawOntoBoard).toHaveBeenCalled();
    })


    it('drawLine() => drawingLayer.drawLine(line)', ()=>{
      spyOn(canvas.drawingLayer,'drawLine');
      canvas.drawLine();
      expect(canvas.drawingLayer.drawLine).toHaveBeenCalled();
    })



    it('possiblyDrawLine(point) ^ previousPosition == null => previousPosition != null', ()=>{

      let currentPoint = {x:1,y:2};
      canvas.possiblyDrawLine(currentPoint);
      expect(canvas.previousPosition).toBe(currentPoint);
    })


    it('possiblyDrawLine(point) ^ previousPosition != null => setMyPencilLine()', ()=>{

      const p0 = {x:1,y:2}
      const p1 = {x:1,y:3}
      canvas.previousPosition = p0;
      spyOn(canvas.viewModel,'setMyPencilLine');
      canvas.possiblyDrawLine(p1);
      expect(canvas.viewModel.setMyPencilLine).toHaveBeenCalledWith(jasmine.any(Line));
    })


    it(`mouseLeaveHandler(event)
      ^ mouseDown == true
      ^ tool == pencil
     => mouseDown == false
      ^ possiblyDrawLine()`, ()=>{

          canvas.mouseDown = true;
          spyOn(canvas.viewModel,'getMyCurrentTool').and.returnValue('pencil');
          spyOn(canvas,'possiblyDrawLine');
          let point = {x:1,y:1}
          spyOn(canvas.drawingLayer,'getCurrentPosition').and.returnValue(point);
          canvas.mouseLeaveHandler();
          expect(canvas.mouseDown).toBeFalsy();
          expect(canvas.possiblyDrawLine).toHaveBeenCalledWith(point);
          expect(canvas.previousPosition).toBeNull();
      })


      it(`mouseLeaveHandler(event)
        ^ mouseDown == true
        ^ tool == eraser
       => mouseDown == false`, () => {

          canvas.mouseDown = true;
          spyOn(canvas.viewModel,'getMyCurrentTool').and.returnValue('eraser');
          let point = {x:1,y:1}
          spyOn(canvas.drawingLayer,'getCurrentPosition').and.returnValue(point);
          canvas.mouseLeaveHandler();
          expect(canvas.mouseDown).toBeFalsy();
          expect(canvas.previousPosition).toBeNull();
        })


        it('drawFriendLeftMarker() => toolLayer.drawFriendLeftMarker()',()=>{
          canvas.initialize();
          spyOn(canvas.toolLayer,'drawFriendLeftMarker');
          canvas.drawFriendLeftMarker();
          expect(canvas.toolLayer.drawFriendLeftMarker).toHaveBeenCalled();
        })


     })
   })
