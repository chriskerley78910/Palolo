define(['people-models/NullPerson'],
function(NullPerson){
    describe("NullPerson Tests", function(){

    it('creates a person with id -1', ()=>{
      let nullPerson = new NullPerson('something');
      expect(nullPerson.getId()).toBe(-1);
    })

    it('getConstructorName() == NullPerson', ()=>{
      let person = new NullPerson('something');
      expect(person.getConstructorName()).toBe("NullPerson");
    })

    it('isNew() == false',()=>{
      const sut = new NullPerson()
      expect(sut.isNew()).toBeFalsy()
    })

    it('isReal() == false',()=>{
      const p = new NullPerson()
      expect(p.isReal()).toBeFalsy()
    })

    it('getLastSeen() == ""',()=>{
      const p = new NullPerson()
      expect(p.getLastSeen()).toBe('')
    })



    }); // end describe

}); // end define.
