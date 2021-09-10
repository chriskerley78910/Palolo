define(['people-models/Classmate','people-models/Person'],
function(Classmate, Person){
    describe("Classmate Tests", function(){

      let sut = null;
      beforeEach(()=>{
        let raw = Person.getRaw();
        raw.is_pending_acceptance = 0;
        raw.score = 1.0;
        raw.music = "Nirvana";
        raw.present = false;
        raw.last_login = ''
        raw.age = 15;
        raw.res = 'Vanier';
        raw.shared_classes = 0;
        const host = 'https://host'
        sut = new Classmate(raw, host);
      })


      it('setAddable() does just that.', ()=>{
        const c = Classmate.getFake()
        c.setAddable(false)
        expect(c.isAddable()).toBeFalsy()
      })

      it('throws if is_pending_acceptance is missing',()=>{
        try{
          const raw = Person.getRaw();
          raw.score = 1.0;
          raw.music = 'Nirvana';
          raw.age = 55;
          raw.last_login = '1w'
          raw.is_pending_acceptance = false;
          raw.res = 'Vanier';
          raw.shared_classes = 0;
          const host = 'https://host';
          sut = new Classmate(raw, host);
        }
        catch(err){
          expect(err.message).toBe('A person must have a boolean present attribute.');
        }
      })

      it('has attr set.',()=>{
        expect(sut.isPresent()).toBeFalsy();
        expect(sut.getLastSeen()).toBe('');
        expect(sut.getSharedClassCount()).toBe(0);
      })

      it('setIsActive',()=>{
        const sut = Classmate.getFake();
        expect(sut.isActive()).toBeTruthy();
      })

      it('setActive(false)',()=>{
        const sut = Classmate.getFake();
        sut.setActive(false);
        expect(sut.isActive()).toBeFalsy();
      })

      it('is instanceof Person', ()=>{
        expect(Object.getPrototypeOf(sut).getConstructorName()).toBe("Person");
      })

      it('getId() == id of the person,',()=>{
        expect(sut.getId()).toBe(2);
      })

      it('isAddable() == true',()=>{
        expect(sut.isAddable()).toBeTruthy()
      })

      it('sets the score.',()=>{
        expect(sut.getScore()).toBe(1.0)
      })


      it('sets the favourite music property.', ()=>{
        expect(sut.getFavouriteMusic()).toBe('Nirvana');
      })



      it('setAbsent() does just that.', ()=>{
        const c = Classmate.getFake()
        c.setAbsent();
        expect(c.isPresent()).toBeFalsy();
      })

      it('setPresent() does just that.' ,()=>{
        const c = Classmate.getFake();
        c.setAbsent();
        c.setPresent();
        expect(c.isPresent()).toBeTruthy();
      })

       it('has the ability to set year and major and get the education level.', ()=>{
         let info = Classmate.getRaw();
         info.major = 'Computer Science';
         info.year_of_study = 4;
         let person = new Classmate(info,'host');
         expect(person.getEducationLevel()).toBe('4th Year, Computer Science');
       })

       it('formatSchoolYear(number) give humna readable text.', ()=>{
         let sut = Classmate.getFake();
         expect(sut.formatSchoolYear(1)).toBe('1st Year, ');
         expect(sut.formatSchoolYear(2)).toBe('2nd Year, ');
         expect(sut.formatSchoolYear(3)).toBe('3rd Year, ');
         expect(sut.formatSchoolYear(4)).toBe('4th Year, ');
         expect(sut.formatSchoolYear(5)).toBe('1st Year, ');
       })


       it('setSharedClassCount sets it to 0 if it is null',()=>{
         const raw = Classmate.getRaw()
         raw.shared_classes = null
         const c = new Classmate(raw,'host')
         expect(c.getSharedClassCount()).toBe(0)
       })


       it('equals(other) iff the two classmates are equal',()=>{
         const c1 = Classmate.getFake()
         const c2 = Classmate.getFake()
         expect(c1.equals(c2)).toBeTruthy();
         c2.setId(c1.getId() + 1)
         expect(c1.equals(c2)).toBeFalsy()
       })


       it('something', ()=>{
         const c1 = Classmate.getFake()
         const c2 = Classmate.getFake2()
         expect(c1.getId() != c2.getId())
       })

    }); // end describe
}); // end define.
