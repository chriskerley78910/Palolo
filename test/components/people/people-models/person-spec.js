define(['people-models/Person',
        'people-models/NullPerson'],
function(Person, NullPerson){

    describe("Person Tests", function(){
    let sut;

    it('isPresent == false by default', ()=>{
      sut = Person.getFake()
      expect(sut.isPresent()).toBeFalsy()
    })

    it('throws exception if info is not a literal object', ()=>{
      try{
        new Person(new NullPerson(), 'host');
        expect(false).toBeTruthy();
      }
      catch(err){
        expect(err.message).toBe('Expected literal object!')
      }
    })

    it('new Person(invalid info) throws', ()=>{
      let f = ()=>{
        new Person({},'host');
      }
      expect(f).toThrow(new Error('id malformed'));
    })

    getInfo = () =>{
      return {
        id:1,
        first: "Chris",
        last:'Kerley',
        role:"Professor",
        small_photo_url: 's',
        large_photo_url: 'l',
        present:true,
        last_login:'',
        is_active:true,
        shared_classes:2,
        age:15,
        res:"Bethune"
      }
    }



    createPersonWithPhoto = ()=>{
      let info = getInfo();
      info.large_photo_url = 'profile_images/1l.jpg';
      info.small_photo_url = 'profile_images/1s.jpg';
      let host = 'http://host';
      return new Person(info, host);
    }

    createPersonByRole = (role) =>{
      let person = Person.getFake();
      person.setRole(role);
      return person;
    }

    it('constructor throws if raw.first is null',()=>{
      try{
        const raw = Person.getRaw()
        raw.first = null
        new Person(raw,'host')
      }
      catch(err){
        expect(err.message).toBe('must be a non-empty string');
      }
    })




    it('setHost(host) does just that. ',()=>{
      const sut = Person.getFake();
      expect(sut.getHost()).not.toBe('newhost')
      sut.setHost('newhost')
      expect(sut.getHost()).toBe('newhost')
    })

    it('getConstructorName() == Person', ()=>{
      let person = Person.getFake();
      expect(person.getConstructorName()).toBe("Person");
    })

    it('new Person(valid info has all properties set)', ()=>{
      let person = Person.getFake();
      console.log(person)
      expect(person.getId()).toBe(2);
      expect(person.getDefaultPhotoURL()).toBe("./assets/no-photo.jpg");
      expect(person.getSmallPhotoURL()).toBe('https://www.profile.palolo.ca//profile_images/485s.jpg');
      expect(person.getLargePhotoURL()).toBe('https://www.profile.palolo.ca//profile_images/485l.jpg');
      expect(person.getFirst()).toBe("First");
      expect(person.getLast()).toBe('Last');
      expect(person.getRole()).toBe("Student");
    })

    it('setDefaultPhotoURL() does just that.', ()=>{
      let person = Person.getFake();
      person.setSmallPhotoURL('url');
      person.setDefaultPhotoURL();
      expect(person.getSmallPhotoURL()).toBe('./assets/no-photo.jpg');
    })

    it('getSmallPhotoURL() == host + small_photo_url',()=>{
      let p = createPersonWithPhoto();
      expect(p.getSmallPhotoURL()).toBe('http://host/profile_images/1s.jpg');
    })

    it('getSmallPhotoURL() == default photo if the url is missing',()=>{
      const p = Person.getRaw()
      p.small_photo_url = null
      const p2 = new Person(p,'host')
      p2.setSmallPhotoURL(null)
      expect(p2.getSmallPhotoURL()).toBe(p2.defaultPhotoURL)
    })

    it('setSmallPhotoURL(url) does just that.',()=>{
      let p = createPersonWithPhoto();
      let url = 'images/1.jpg';
      p.setSmallPhotoURL(url);
      let expected = p.getHost() + '/' + url;
      expect(p.getSmallPhotoURL()).toBe(expected);
    })

   it('getLargePhotoURL() == host + large_photo_url',()=>{
     let p = createPersonWithPhoto();
     expect(p.getLargePhotoURL()).toBe('http://host/profile_images/1l.jpg');
   })

   it('setLargePhotoURL(url) does just that.',()=>{
     let p = createPersonWithPhoto();
     let url = 'images/1.jpg';
     p.setLargePhotoURL(url);
     let expected = p.getHost() + '/' + url;
     expect(p.getLargePhotoURL()).toBe(expected);
   })

   it('getHost() == url', ()=>{
     let p = Person.getFake();
     expect(p.getHost()).toBe('https://www.profile.palolo.ca/');
   })

   it('isAddable() == false', ()=>{
     const sut = Person.getFake()
     expect(sut.isAddable()).toBeFalsy();
   })

   it('isReal() == true',()=>{
     const p = Person.getFake()
     expect(p.isReal()).toBeTruthy()
   })

   it('getRelativeSmallPhotoURL',()=>{
     const p = Person.getFake()
     expect(p.getRelativeSmallPhotoURL()).toBe('profile_images/485s.jpg')
     expect(p.getRelativeLargePhotoURL()).toBe('profile_images/485l.jpg')
   })

}); // end describe



}); // end define.
