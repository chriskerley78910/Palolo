
 define([
   'abstract-interfaces/Observer',
   'abstract-interfaces/ObservableSubject'],
   function(
     Observer,
     ObservableSubject){

   describe('Observer tests -',()=>{


     it('throws an error when a non Observer type is passed to attach', () =>{

       var o = new ObservableSubject();
       expect(()=>{o.attach('not a Observer');}).toThrow(new Error("Can only attach Observers"));
     })


     it('does not throw an error if a Observer is passed to attach', () =>{
       var o = new ObservableSubject();
       var observer = new Observer();
       // console.log(observer);
      expect(()=>{ o.attach(observer);}).not.toThrow(new Error());
     })


     it('sents update to all its observers', ()=>{

       var o = new ObservableSubject();

       var ob1 = new Observer();
       console.log(ob1);
       spyOn(ob1,'update');
       o.attach(ob1);

       var ob2 = new Observer();
       spyOn(ob2,'update');
       o.attach(ob2);

       // sut
       o.notify();


       expect(ob1.update).toHaveBeenCalled();
       expect(ob2.update).toHaveBeenCalled();
     })


     it('sends the updates with a message', () =>{

       var o = new ObservableSubject();

       var ob1 = new Observer();
       spyOn(ob1,'update');
       o.attach(ob1);

      o.notify('hello');

      expect(ob1.update).toHaveBeenCalledWith('hello');
     })

   }); // end describe.
 });
