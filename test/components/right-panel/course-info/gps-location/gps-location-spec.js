
define(['right-panel/course-info/gps-location/Component',
        'course/models/CourseGroup'],
function(Component,
         CourseGroup){

    describe("gps-location Tests", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })

      it('isVisible() == false by default', ()=>{
        expect(sut.isVisible()).toBeFalsy();
      })

      it('checkInLocation() ^ navigator.geolocation => geolocation.getCurrentPosition()', ()=>{
        spyOn(navigator.geolocation,'getCurrentPosition');
        sut.checkInLocation();
        expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalledWith(sut.onGPSPosition, sut.onGPSError, jasmine.any(Object));
      })

      it('onGPSPosition() => dispatch(location)', ()=>{
        spyOn(sut._dispatcher,'dispatch');
        sut.onGPSPosition(new Object());
        expect(sut._dispatcher.dispatch).toHaveBeenCalledWith('checkInLocation', jasmine.any(Object));
      })

    }); // end describe
}); // end define.
