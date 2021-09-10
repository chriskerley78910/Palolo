define(['payment/tutoring-plans/Component',
        'payment/models/TutoringPlan'],
(Component,
 TutoringPlan) => {

    describe("tutoring-payments", ()=>{

      let sut
      beforeEach(()=>{
        sut = new Component.viewModel()
      })

      it('onStore, isTutoringPlansOpen == false => do not get the tutoring plans.', ()=>{
        spyOn(sut.store,'isTutoringPlansOpen').and.returnValue(false)
        spyOn(sut.store,'getTutoringPlans')
        sut.onStore()
        expect(sut.store.getTutoringPlans).not.toHaveBeenCalled()
      })

      it('onStore => plans() is the list of plans', ()=>{
        const p1 = TutoringPlan.getFake()
        p1.setId(1)

        const p2 = TutoringPlan.getFake()
        p2.setId(2)

        const p3 = TutoringPlan.getFake()
        p3.setId(3)

        spyOn(sut.store,'getTutoringPlans').and.returnValue({
          normalPlan:p1,
          packagedPlans:[p2,p3]
        })
        spyOn(sut.store,'isTutoringPlansOpen').and.returnValue(true)
        sut.onStore()
        const expectedTotal = p1.getHours() * p1.getHourlyRate()
        expect(Number(sut.total())).toBe(expectedTotal)
        expect(sut.hours()).toBe(p1.getHours())
        expect(sut.hourlyRate()).toBe(p1.getHourlyRate())
        expect(sut.plans()[0].getId()).toBe(p2.getId())
        expect(sut.plans()[1].getId()).toBe(p3.getId())
      })


      it('onStore, isWaitingForServer => showSpinner',()=>{
        expect(sut.showSpinner()).toBeFalsy()
        spyOn(sut.store,'isWaitingForServer').and.returnValue(true)
        spyOn(sut.store,'getTutoringPlans').and.returnValue({
          packagedPlans:[],
          normalPlan:TutoringPlan.getFake()
        })
        sut.onStore()
        expect(sut.showSpinner()).toBeTruthy()
      })

      it('onHoursChanged',()=>{
        sut.onHoursChanged(6)
        expect(sut.hours()).toBe(5)

        sut.onHoursChanged('')
        expect(sut.hours()).toBe(1)

        sut.onHoursChanged(0)
        expect(sut.hours()).toBe(1)
      })

      it('buy dispatches the number of hours bought',()=>{
        const hours = '2'
        const id = 1
        sut.hours(hours)
        spyOn(sut.dis,'dispatch')
        spyOn(sut.store,'getSelectedTutorId').and.returnValue(id)
        sut.buy()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('buyHours',jasmine.objectContaining({
          hours:Number(hours),
          tutor:id
        }))
      })

      it('onStore updates visibility',()=>{
        sut.store.isTutoringPlansOpen = () => true
        spyOn(sut.store,'getTutoringPlans').and.returnValue({
          packagedPlans:[],
          normalPlan:TutoringPlan.getFake()
        })
        sut.onStore()
        expect(sut.isVisible()).toBeTruthy()
        sut.store.isTutoringPlansOpen = () => false
        sut.onStore()
        expect(sut.isVisible()).toBeFalsy()
      })


      it('closePaymentOptions() => dispatch it',()=>{
        spyOn(sut.dis,'dispatch')
        sut.closePaymentOptions()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('closeTutoringPlans')
      })

      it('choosePackage => dispatch the plan and tutorId',()=>{
        spyOn(sut.dis,'dispatch')
        const plan = TutoringPlan.getFake()
        const tutorId = 23
        spyOn(sut.store,'getSelectedTutorId').and.returnValue(tutorId)
        sut.choosePackage(plan)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('selectTutoringPlan',jasmine.objectContaining({
          plan:plan.getId(),
          tutor:tutorId
        }))
      })



    })
})
