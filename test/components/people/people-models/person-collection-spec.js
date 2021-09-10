define(['people-models/Classmate',
        'people-models/NullPerson',
        'people-models/Pal',
        'people-models/PersonCollection'],
function(Classmate, NullPerson, Pal, PersonCollection){

    describe("PersonCollection Tests", function(){
    let sut;

    beforeEach(()=>{
      sut = new PersonCollection()
    })

    it('getOldPals() returns a collection of non-new pals',()=>{
      const p1 = Pal.getFake()
      p1.setIsNew(1)

      const p2 = Pal.getFake()
      p2.setIsNew(0)
      p2.setId(p1.getId() + 1)

      sut.add(p1)
      sut.add(p2)

      const oldPals = sut.getOldPals()
      const newPals = sut.getNewPals()

      expect(newPals.getSize()).toBe(1)
      expect(oldPals.getSize()).toBe(1)

      expect(newPals.get(0).getId()).toBe(p1.getId())
      expect(oldPals.get(0).getId()).toBe(p2.getId())
    })


    it('sortByPresence does just that.', ()=>{
      const c1 = Classmate.getFake()
      c1.setPresent(true)
      const c2 = Classmate.getFake()
      c2.setId(c1.getId() + 1)
      c2.setPresent(false)
      sut.add(c1)
      sut.add(c2)
      expect(sut.get(0).getId()).toBe(c1.getId())
      expect(sut.get(1).getId()).toBe(c2.getId())

      // inserts at the right position.
      const c3 = Classmate.getFake()
      c3.setId(c2.getId() + 1)
      sut.add(c3)
      expect(sut.get(1).getId()).toBe(c3.getId())
      expect(sut.get(2).getId()).toBe(c2.getId())
    })


    it('applyToMatch applies a function to a matching person if found.', ()=>{
      const p = Classmate.getFake()
      sut.add(p)
      sut.applyToMatch(p, function(match){
        match.setFirst('Bob')
      })
      const updated = sut.getPersonById(p.getId())
      expect(updated.getFirst()).toBe('Bob')
    })

    it('getPersonById() == null if no match is in the list',()=>{
      const id = 2
      const p = sut.getPersonById(id)
      expect(p).toBeNull()
    })

    it('getPersonById() == null if no match is in the list',()=>{
      const p1 = Classmate.getFake()
      sut.add(p1)
      const p2 = sut.getPersonById(p1.getId())
      expect(p2.getId()).toBe(p1.getId())
    })

    it('add(person) throws if that person is already in the collection',()=>{
      try{
        const p = Classmate.getFake()
        sut.add(p)
        sut.add(p)
      }
      catch(err){
        expect(err.message).toBe('Duplicate entry')
      }
    })

    it('add(person) adds that person',()=>{
      const p = Classmate.getFake();
      sut.add(p)
      expect(sut.getSize()).toBe(1)
    })


    it('add(person) adds unique classmates',()=>{
      const c1 = Classmate.getFake()
      const c2 = Classmate.getFake()
      c2.setId(c2.getId() + 1)
      sut.add(c1)
      sut.add(c2)
      expect(sut.getSize()).toBe(2)
    })

    it('add(classmate) does not add duplicates',()=>{
      const c1 = Classmate.getFake()
      const c2 = Classmate.getFake()
      c2.setId(c2.getId() + 1)
      sut.add(c1)
      sut.add(c2)
      expect(sut.getSize()).toBe(2)
    })

    it('toArray() returns a sorted array',()=>{
      const c1 = Classmate.getFake()
      c1.setScore(0.2)
      const c2 = Classmate.getFake()
      c2.setScore(0.1)
      c2.setId(c1.getId() + 1)
      sut.add(c1)
      sut.add(c2)
      const r = sut.toArray()
      expect(r[0]).toBe(c1)
      expect(r[1]).toBe(c2)
    })

    it('compare return the one with the highest score if both have the same presence', ()=>{
      const c1 = Classmate.getFake()
      const c2 = Classmate.getFake()
      c1.setPresent(true)
      c2.setPresent(true)
      c1.setScore(0.2)
      c2.setScore(0.1)
      const result1 = sut.compare(c1,c2)
      expect(result1).toBe(-1)

      c1.setPresent(false)
      c2.setPresent(false)
      const result2 = sut.compare(c1,c2)
      expect(result2).toBe(-1)
    })

    it('sort returns the present one regardless of the score', ()=>{
      const c1 = Classmate.getFake()
      const c2 = Classmate.getFake()
      c1.setPresent(true)
      c2.setPresent(false)
      c1.setScore(0.1)
      c2.setScore(0.2)
      const result1 = sut.compare(c1,c2)
      expect(result1).toBe(-1)
    })

    it('byScore returns -1 if a.score > b.score',()=>{
      const c1 = Classmate.getFake()
      const c2 = Classmate.getFake()
      c1.setId(1)

      c1.setScore(0.2)
      c2.setScore(0.1)
      expect(sut.byScore(c1,c2)).toBe(-1)

      c1.setScore(0.1)
      c2.setScore(0.2)
      expect(sut.byScore(c1,c2)).toBe(1)

      c1.setScore(0.2)
      c2.setScore(0.2)
      expect(sut.byScore(c1,c2)).toBe(-1)
    })

    it('byPresence == -1 if a.isPresent and b is not',()=>{
      const c1 = Classmate.getFake()
      const c2 = Classmate.getFake()
      c1.setPresent(true)
      c2.setPresent(false)
      expect(sut.byPresence(c1,c2)).toBe(-1)

      c1.setPresent(false)
      c2.setPresent(true)
      expect(sut.byPresence(c1,c2)).toBe(1)

      c1.setPresent(true)
      c2.setPresent(true)
      expect(sut.byPresence(c1,c2)).toBe(0)
    })

    it('remove(person) does just that.',()=>{
      const c1 = Classmate.getFake()
      sut.add(c1);
      sut.remove(c1)
      expect(sut.getSize()).toBe(0)
    })

    it('remove(person) does not remove any other elements.',()=>{
      const c1 = Classmate.getFake()
      const c2 = Classmate.getFake()
      c2.setId(c2.getId() + 1)
      sut.add(c1);
      sut.add(c2)
      sut.remove(c1)
      expect(sut.getSize()).toBe(1)
      expect(sut.get(0).getId()).toBe(c2.getId())
    })

    it('duplicate(collection) changes the internal data to match the passed collection', ()=>{
      const c1 = Classmate.getFake()
      const c2 = Classmate.getFake()
      c2.setId(c2.getId() + 1)
      const col = new PersonCollection()
      col.add(c1)
      col.add(c2)

      sut.add(c1)
      sut.duplicate(col)
      expect(sut.getSize()).toBe(2)
    })

    it('duplicate(collection) throws if the collection is not a classmate collection', ()=>{
      try{
        sut.duplicate({})
      }
      catch(err){
        expect(err.message).toBe('Expected a PersonCollection')
      }
    })

    it('equals(other) == true if the elements are the same and in the same order',()=>{
      const other = new PersonCollection()
      sut.add(Classmate.getFake())
      other.add(Classmate.getFake())
      expect(sut.equals(other)).toBeTruthy();
      const c2 = Classmate.getFake()
      c2.setId(c2.getId() + 1)
      sut.add(c2)
      expect(sut.equals(other)).toBeFalsy()
    })




}); // end describe



}); // end define.
