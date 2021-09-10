
 define(['punch-clock/Component'],
 function(Component){

   describe('session-tracker tests',()=>{

     beforeEach(()=>{
       sut = new Component.viewModel()
     })

     it('showSessionRecordSaved() == true if store.showSessionRecordSaved() == true', ()=>{
       expect(sut.showSessionRecordSaved()).toBeFalsy()
       spyOn(sut.store,'isRecordSavedShowing').and.returnValue(true)
       sut.onStore()
       expect(sut.showSessionRecordSaved()).toBeTruthy()
     })

     it('onStore, resets sessionDuration to 1 if 1 or more hours remain.',()=>{
       sut.sessionDuration(10)
       spyOn(sut.store,'getTimeRemaining').and.returnValue(1)
       sut.onStore()
       expect(sut.sessionDuration()).toBe(1)
     })

     it('onStore, resets sessionDuration to 0 if less than 1 hour remains',()=>{
       sut.sessionDuration(10)
       spyOn(sut.store,'getTimeRemaining').and.returnValue(0.5)
       sut.onStore()
       expect(sut.sessionDuration()).toBe(0)
     })

     it('onStore, isVisible(), !isTutor() => isVisible() == false',()=>{
       spyOn(sut.store,'isVisible').and.returnValue(true)
       spyOn(sut.store,'isTutor').and.returnValue(false)

       sut.onStore()
       expect(sut.isVisible()).toBeFalsy()

       sut.store.isTutor.and.returnValue(true)
       sut.onStore()
       expect(sut.isVisible()).toBeTruthy()
     })

     it('onStore => setMaxDuration(getTimeRemaining)', ()=>{
       const time = 5
       spyOn(sut.store,'getTimeRemaining').and.returnValue(time)
       spyOn(sut,'setMaxDuration')
       sut.onStore()
       expect(sut.setMaxDuration).toHaveBeenCalledWith(time)
     })


     it('setMaxDuration => maxDuration == time',()=>{
       const time = 4
       sut.setMaxDuration(time)
       expect(sut.maxDuration()).toBe(time)
     })

     it('setMaxDuration(0.5) => maxDuration == 1',()=>{
       const time = 0.5
       sut.setMaxDuration(time)
       expect(sut.maxDuration()).toBe(0)
     })

     it('maxDate() == today', ()=>{
       const today = sut.getToday()
       expect(sut.maxDate()).toBe(today)
     })

     it('onStore resets the sessionDate', ()=>{
       const TR = 1
       const TF = 2
       sut.sessionDate('123')
       sut.onStore()
       expect(sut.sessionDate()).toBe('')
     })


     it('checkDate("") => isDateValid == false',()=>{
       sut.isDateValid(true)
       sut.checkDate('')
       expect(sut.isDateValid()).toBeFalsy()
     })

     it('checkDate(today) => isDateValid() == true',()=>{
       sut.isDateValid(false)
       sut.checkDate('01/02/2020')
       expect(sut.isDateValid()).toBeTruthy()
     })

     it('saveTime => dispatch data and duration of the session.', ()=>{
       spyOn(sut.dis,'dispatch')
       const date = '02/01/2020'
       const duration = '1'
       const id = 5
       spyOn(sut.store,'getFocusedPersonId').and.returnValue(id)
       sut.sessionDate(date)
       sut.sessionDuration(duration)
       sut.saveTime()
       expect(sut.dis.dispatch).toHaveBeenCalledWith('saveSessionTime',jasmine.objectContaining({
         date:date,
         duration:duration,
         customerId:id
       }))
     })




   }); // end describe.
 });
