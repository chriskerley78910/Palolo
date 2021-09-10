
 define([
   'abstract-interfaces/Observer',
   'abstract-interfaces/ObservableSubject'],

   function(
     Observer,
     Observable){

   describe('Observable tests -',()=>{


     it('throws an error when a non Observer type is passed to attach', () =>{

       var o = new Observable();
       expect(()=>{o.attach('not a Observer');})
       .toThrow(new Error("Can only attach Observers"));
     })


     it('returns the number of observables currently attached when observerCount() is called', () =>{

       var o = new Observable();
       expect(o.getObserverCount()).toBe(0);
       o.attach(new Observer());
       expect(o.getObserverCount()).toBe(1);
     })


     it('removes a specific observable when detach(o) is called where o is the observer.', () =>{

       var o = new Observable();
       var observer = new Observer();
       o.attach(observer);
       expect(o.getObserverCount()).toBe(1);
       o.detach(observer);
       expect(o.getObserverCount()).toBe(0);
     })


     it('does not remove an observable if the o  in detach(o) does not match any stored observers.', () =>{
       var o = new Observable();
       var observer = new Observer();
       o.attach(observer);
       expect(o.getObserverCount()).toBe(1);
       o.detach(new Observable());
       expect(o.getObserverCount()).toBe(1);
     })



     it('returns an array of names of current observers when getObservers is called', () =>{
       var o = new Observable();
       var observer = new Observer();
       o.attach(observer);
       expect(o.getObservers()[0]).toBe('Observer');
     })



   }); // end describe.
 });
