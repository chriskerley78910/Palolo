
 define(['session-tracker/SessionStore',
         'people-models/Person'],
 function(Store,
          Person){

   describe('session-store tests',()=>{

     let sut = null

     beforeEach(()=>{
       sut = Store.getNew()
     })

     it('onGetAcccountInfo => waiting, pub()',done =>{
       expect(sut.isRefreshingInfo()).toBeFalsy()
       sut.onPub(()=>{
         expect(sut.isRefreshingInfo()).toBeTruthy()
         done()
       })
       sut.onGetAcccountInfo()
     })


     it('onError => sets message and pubs', done =>{
       sut.savingSession = true
       const m = {}
       expect(sut.getErrorMessage()).toBe(null)
       sut.onPub(()=>{
         expect(sut.isSavingSession()).toBeFalsy()
         expect(sut.getErrorMessage()).toBe(m)
         done()
       })
       sut.onError(m)
     })


     it('focusPerson => sets focusedPerson', ()=>{
       expect(sut.getFocusedPersonId()).toBeNull()
       const p = Person.getFake()
       spyOn(sut.dis,'dispatch')
       sut.setFocusedPersonId(p)
       expect(sut.getFocusedPersonId()).toBe(p.getId())
       expect(sut.dis.dispatch).toHaveBeenCalledWith('getAccountInfo',p.getId())
     })


     it('closeSessionTracker => does that.', done => {
       sut.visible = true
       sut.onPub(()=>{
          expect(sut.isVisible()).toBeFalsy()
          done()
      })
      sut.closeSessionTracker()

     })

     it('openSessionTracker => isVisible() == true', done => {
       expect(sut.isVisible()).toBeFalsy()
       expect(sut.dis.getCallbackById(sut.openerId)).toBe(sut.openSessionTracker)
       sut.onPub(()=>{
            expect(sut.isVisible()).toBeTruthy()
            expect(sut.isTutor()).toBeTruthy()
            done()
       })
       const tutor = true
       sut.openSessionTracker(tutor)
     })


     it(`onSaveSession() => isSavingSession() == true`,done =>{
       expect(sut.isSavingSession()).toBeFalsy()
       sut.onPub(()=>{
          expect(sut.isSavingSession()).toBeTruthy()
          done()
       })
      sut.onSaveSession()

     })

     it('onAccountInfoReceived() => isSavingSession() == false', done => {
       sut.savingSession = true
       expect(sut.isSavingSession()).toBeTruthy()
       const data = {
         fulfilled:8,
         remaining:2
       }
       spyOn(sut,'showRecordSavedMessage')
       sut.onPub(()=>{
         expect(sut.isSavingSession()).toBeFalsy()
         expect(sut.getTimeRemaining()).toBe(data.remaining)
         expect(sut.getTimeFulfilled()).toBe(data.fulfilled)
         expect(sut.showRecordSavedMessage).toHaveBeenCalled()
         done()
       })
       sut.onAccountInfoReceived(data)
     })


     it('showRecordSavedMessage() => recordSavedShowing == true, pub', ()=> {
        expect(sut.isRecordSavedShowing()).toBeFalsy()
        sut.showRecordSavedMessage()
        expect(sut.isRecordSavedShowing()).toBeTruthy()
     })

   }); // end describe.
 });
