
define(['profile-setter/view-models/user-info/Component'],
function(Component){

    describe("Test user-info Component", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })



      it('onStoreChange() => all info observables are set.',()=>{
        sut.store.getUserInfo = () => {
          const res_arr = [
            {
              res_id:1,
              name:'Vanier'
            },
            {
              res_id:2,
              name:'Strong'
            }
          ];
          return {
            first:'chris',
            last:'kerley',
            sex:0,
            res:1,
            res_arr:res_arr,
            birthday:(new Date('2000-09-09 00:00:00')).toISOString(),
            year_of_study:4,
            major_name:'Computer Science',
            about_me:"Balls",
            music:"Nirvana"
          }
        }
        sut.onStoreChange()
        expect(sut.selectedRes()).toBe(1),
        expect(sut.residenceOptions().length).toBe(2)
        expect(sut.birthDay()).toBe(9)
        expect(sut.birthYear()).toBe(2000)
        expect(sut.birthMonth()).toBe(9)
        expect(sut.majorText()).toBe('Computer Science')
        expect(sut.aboutMe()).toBe('Balls')
        expect(sut.favMusicArtist()).toBe('Nirvana')
      })



      it('onYearOfStudyLostFocus(false) => _remoteService.setYearOfStudy(year)',()=>{
        spyOn(sut.dis,'dispatch');
        sut.yearOfStudyInput('4');
        sut.onYearOfStudyLostFocus(false);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('selectYear', '4');
      })

      it('showMajorInput(0) == isMajorTextVisible() == false',()=>{
        sut.isMajorTextVisible(true);
        sut.majorText('something');
        sut.isMajorInputFocused(false);
        sut.showMajorInput();
        expect(sut.isMajorTextVisible()).toBeFalsy();
        expect(sut.partialMajor()).toBe('');
        expect(sut.isMajorInputFocused()).toBeTruthy();
      })

      it('getMajors(input) => dispatch(getStudentMajors)',()=>{
        let input = "some input";
        spyOn(sut.dis,'dispatch');
        sut.getMajors(input);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('getStudentMajors',input);
      })

      it('selectSuggestedMajor(object, event)', ()=>{
        let majorId = '2';
        let obj = {
          major_id:majorId
        }
        spyOn(sut.dis,'dispatch');
        sut.suggestedMajors(['a']);
        sut.selectSuggestedMajor(obj);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('selectMajor',majorId);
        expect(sut.suggestedMajors().length).toBe(0);
      })


      it('saveMyInfo() dispatches saveMyInfo(profileInfo)',()=>{
        const obj = {}
        spyOn(sut,'getProfileInfo').and.returnValue(obj)
        spyOn(sut.dis,'dispatch')
        const event = {preventDefault:()=>{},stopPropagation:()=>{}}
        sut.saveMyInfo(null,event);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('saveMyInfo', obj)
      })

      it('getProfileInfo() returns an info object',()=>{
        const obj = sut.getProfileInfo()
        const keys = Object.keys(obj)
        expect(keys.length).toBe(7)
      })

    }); // end describe

}); // end define.
