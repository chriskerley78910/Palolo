define(['payment/models/TutoringPlan'],
      (TutoringPlan) => {

    describe("tutoring-plan", () =>{

      let sut
      let raw
      beforeEach(()=>{
        sut = TutoringPlan.getFake()
        raw = TutoringPlan.getRaw()
      })

      it('it sets the planId',()=>{
        expect(sut.getId()).toBe(raw.plan_id)
      })

      it('sets the hours included.', ()=>{
        expect(sut.getHours()).toBe(raw.hours)
      })

      it('sets the hourlyRate', ()=>{
        expect(sut.getHourlyRate()).toBe(raw.hourly_rate / 100.)
      })

      it('sets the dicountedHours', ()=>{
        expect(sut.getDiscountedHours()).toBe(raw.discounted_hours)
      })

      it('sets the duration of the plan', ()=>{
        expect(sut.getDuration()).toBe(raw.duration_days)
      })

      it('sets the description', ()=>{
        expect(sut.getDescription()).toBe(raw.description)
      })


    })
})
