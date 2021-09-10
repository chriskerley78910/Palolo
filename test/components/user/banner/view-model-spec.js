
define(['banner/ViewModel'], function(ViewModel){

    describe("Test ViewModel", function(){


      let sut = null;

      beforeEach(() => {
        sut = new ViewModel.viewModel();
      })

      it('onStore, no userInfo => does nothing',()=>{
        spyOn(sut,'usersName')
        spyOn(sut.store,'getUserInfo').and.returnValue(null)
        sut.onStore()
        expect(sut.usersName).not.toHaveBeenCalled()
      })

      it('closeSearch => isSearchVisible() == false', ()=>{
        sut.isSearchVisible(true)
        const e = {stopPropagation:jasmine.createSpy()}
        expect(sut.closeSearch(null, e)).toBeFalsy()
        expect(sut.isSearchVisible()).toBeFalsy()
        expect(e.stopPropagation).toHaveBeenCalled()
      })

      it('closeSearch, no event => do not stopPropagation', ()=>{
        const e = {stopPropagation:jasmine.createSpy()}
        expect(sut.closeSearch(null, null)).toBeFalsy()
        expect(e.stopPropagation).not.toHaveBeenCalled()
      })

      it('openSearch => isSearchVisible()', ()=>{
        expect(sut.isSearchVisible()).toBeFalsy()
        sut.openSearch()
        expect(sut.isSearchVisible()).toBeTruthy()
      })


      it('openCourseAdder() dispatchers openCourseAdder', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.openCourseAdder();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('openCourseAdder');
      })


      it('logout() => dispatch(logout)',()=>{
        spyOn(sut.dis,'dispatch');
        sut.logOut();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('logout');
      })

      it('userState == authenticated <=> isBannerVisible == true', () =>{
        sut.onAuth('anonymous');
        expect(sut.isBannerVisible()).toBeFalsy();
        sut.onAuth({state:'authenticated'});
        expect(sut.isBannerVisible()).toBeTruthy();
        sut.onAuth('anonymous');
        expect(sut.isBannerVisible()).toBeFalsy();
      })


      it('isAdminButtonVisible() == false by default', ()=>{
        expect(sut.isAdminButtonVisible()).toBeFalsy();
      })


      it('opens the options dropdown menu when the little triangle is pressed', () =>{

          expect(sut.isMenuVisible()).toBeFalsy();
          sut.onAuth('authenticated');
          sut.toggleDropDown();
          expect(sut.isMenuVisible()).toBeTruthy();
      })

      it('openProfileSetter() => isMenuVisible() == false', ()=>{
          sut.isMenuVisible(true);
          spyOn(sut.dis,'dispatch');
          sut.openProfileSetter();
          expect(sut.isMenuVisible()).toBeFalsy();
          expect(sut.dis.dispatch).toHaveBeenCalledWith('showProfileSetter');
      })

      it('isAdminVisible() == false by default', ()=>{
        expect(sut.isAdminVisible()).toBeFalsy();
      })

      it('openAdminPanel() => isAdminVisible() == true', ()=>{
        sut.isMenuVisible(true);
        sut.openAdminPanel();
        expect(sut.isAdminVisible()).toBeTruthy();
        expect(sut.isMenuVisible()).toBeFalsy();
      })
      it('onStore() => updates photo and stuff.', ()=>{

        sut.store.getUserInfo = ()=>{
          return {
            role:'user',
            first:'Chris',
            last:'Kerley',
            small_photo_url:null
          }
        }
        sut.isAdminButtonVisible(true);
        expect(sut.isAdminButtonVisible()).toBeTruthy();
        sut.onStore();

        expect(sut.isAdminButtonVisible()).toBeFalsy();
        expect(sut.usersName()).toBe('Chris Kerley, rep: undefined');
        expect(sut.smallPhotoUrl()).toBe('./assets/no-photo.jpg');
      })


      it('onUserInfoUpdate() ^ smallPhotoUrl != null => set smallPhotoUrl()', ()=>{

        sut.store.getUserInfo = ()=>{
          return {
          role:'user',
          first:'Chris',
          last:'Kerley',
          small_photo_url:'fake url'
        }}
        sut.onStore();
        expect(/fake url\?[0-9]{1,}/.test(sut.smallPhotoUrl())).toBeTruthy();
      })

    }); // end describe

}); // end define.
