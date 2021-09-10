
 define(['environment/Component'],
   function(Component){

   describe('Environment tests -',()=>{

     let vm = null;
     beforeEach(()=>{
       vm = new Component.viewModel();
     })

     it('registers authState callback on dispatcher', ()=>{
       let cb = vm._dispatcher.getCallbackById(vm.authStateId);
       expect(cb).toBe(vm.onAuthUpdate);
     })

     it('showConnectionLost() == false', () =>{
       expect(vm.showConnectionLost()).toBeFalsy();
     })

     it('onOnline() == showConnectionLost() == false', () =>{
       vm.onOnline();
       expect(vm.showConnectionLost()).toBeFalsy();
     })

     it('onOffline() == showConnectionLost() == true', () =>{
       vm.onOffline();
       expect(vm.showConnectionLost()).toBeTruthy();
     })

    let setUserAgent = function(userAgent) {
      window.navigator.__defineGetter__('userAgent', function () {
      	return userAgent;
      });
    }

    it('userAgent == Android => isSupportedDevice() == true',()=>{
      setUserAgent('Android');
      expect(vm.isSupportedDevice()).toBeTruthy();
    })

    it('userAgent == Chrome => isSupportedDevice() == true',()=>{
      setUserAgent('Chrome');
      expect(vm.isSupportedDevice()).toBeTruthy();
    })

    it('innerWidth < 500 => isSupportedDevice() == false', ()=>{
      spyOn(vm,'getWindowWidth').and.returnValue(499);
      expect(vm.isSupportedDevice()).toBeFalsy();
    })

    it('userAgent == Chrome => isSupportedDevice() == true',()=>{
      setUserAgent('iPod');
      expect(vm.isSupportedDevice()).toBeFalsy();
    })

     it('onAuthUpdate(authenticated) ^ isSupportedDevice() => showDeviceNotSupportedMessage() == true', ()=>{
       setUserAgent('iPod');
       vm.onAuthUpdate({state:'authenticated',id:5});
       expect(vm.showDeviceNotSupportedMessage()).toBeTruthy();
     })

     it('onAuthUpdate(authenticated) ^ isSupportedDevice() == false => showDeviceNotSupportedMessage() == false', ()=>{
       setUserAgent('Chrome');
       vm.onAuthUpdate({state:'authenticated',id:5});
       expect(vm.showDeviceNotSupportedMessage()).toBeFalsy();
     })

   }); // end describe.
 });
