
define(['profile-setter/view-models/permission-error/Component'],
function(Component){

    describe("Test permission-error Component", function(){
      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })

      const mockStore = (bool) =>{
        sut.store = {  // change ref,  not what the ref points to.
          getCurrentState : ()=>{
            return {
              isPermissionErrorVisible:()=>{return bool;}
            }
          }
        }
      }

      it('onStoreChange ^ isPermissionErrorVisible => isVisible()',()=>{
        expect(sut.isVisible()).toBeFalsy();
        mockStore(true);
        sut.onStoreChange();
        expect(sut.isVisible()).toBeTruthy();
      })

      it('onStoreChange ^ !isPermissionErrorVisible => !isVisible()',()=>{
        expect(sut.isVisible()).toBeFalsy();
        mockStore(false);
        sut.onStoreChange();
        expect(sut.isVisible()).toBeFalsy();
      })


      it('onOkay', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.onOkay();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('acknowledgePermissionNeed');
      })

      it('onMaybeLater() => hideProfileSetter', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.onMaybeLater();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('hideProfileSetter');
      })

    }); // end describe

}); // end define.
