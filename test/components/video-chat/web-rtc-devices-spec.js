
 define([ 'video-chat/WebRTCDevices',],
   function(WebRTCDevices){

   describe('web-rtc-devices tests',()=>{

     let sut = null;
     beforeEach(()=>{
      sut = WebRTCDevices.getNew();
     })

     it('_detect is a ref to the library.',()=>{
       expect(typeof sut._detect).toBe('object');
     })

     it('reg callback does just that.',done => {
       sut.reg('name',(capabilities)=>{
         expect(capabilities.hasWebcam).toBeFalsy()
         expect(capabilities.hasMicrophone).toBeFalsy()
         done();
       })
    })

    it('getCapabilties(), both available => returns true for both.',()=>{
      spyOn(sut,'isWebcamAvailable').and.returnValue(true)
      spyOn(sut,'isMicrophoneAvailable').and.returnValue(true)
      const result = sut.getCapabilties()
      expect(result).toEqual({hasMicrophone:true, hasWebcam:true})
    })


   }); // end describe.
 });
