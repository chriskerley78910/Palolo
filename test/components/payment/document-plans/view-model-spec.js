define(['payment/document-plans/Component'],
(Component) => {
    describe("document-plans", ()=>{

      let sut
      beforeEach(()=>{
        sut = new Component.viewModel()
      })

      it('onStore updates visibility',()=>{
        spyOn(sut.store,'isDocumentPlansOpen').and.returnValue(true)
        sut.onStore()
        expect(sut.isVisible()).toBeTruthy()
        sut.store.isDocumentPlansOpen.and.returnValue(false)
        sut.onStore()
        expect(sut.isVisible()).toBeFalsy()
      })

      it('onValuePlanClicked() => dispatch(selectValuePlan)',()=>{
        spyOn(sut.dis,'dispatch')
        sut.selectValuePlan()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('selectDocumentPlan',{plan:5})
      })

      it('onMediumPlanClicked() => dispatch(selectMediumPlan)',()=>{
        spyOn(sut.dis,'dispatch')
        sut.selectMediumPlan()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('selectDocumentPlan',{plan:6})
      })

      it('onExpensivePlanClicked() => dispatch(selectExpensivePlan)',()=>{
        spyOn(sut.dis,'dispatch')
        sut.selectExpensivePlan()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('selectDocumentPlan',{plan:7})
      })

      it('closePaymentOptions() => dispatch it',()=>{
        spyOn(sut.dis,'dispatch')
        sut.closePaymentOptions()
        expect(sut.dis.dispatch).toHaveBeenCalled()
      })

    })
})
