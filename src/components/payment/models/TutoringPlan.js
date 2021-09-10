define(['abstract-interfaces/ValidObject'],
function(ValidObject){

    var TutoringPlan = function(raw){

      Object.setPrototypeOf(this, new ValidObject())

      this.getId = function(){
        return this.id
      }

      this.setId = function(id){
        this.validateId(id)
        this.id = id
      }
      this.setId(raw.plan_id)

      this.getHours = function(){
        return this.hours
      }

      this.setHours = function(hours){
        this.validateId(hours)
        this.hours = hours
      }
      this.setHours(raw.hours)


      this.setHourlyRate = function(rate){
        if(!rate || Number(rate) <= 0) throw new Error('hourly_rate must be positive.')
        this.hourlyRate = rate / 100.
      }
      this.setHourlyRate(raw.hourly_rate)

      this.getHourlyRate = function(){
        return this.hourlyRate
      }

      this.getDiscountedHours = function(){
        return this.discountedHours
      }

      this.setDiscountedHours = function(hours){
        if(typeof hours != 'number' || Number(hours) < 0) throw new Error('discounted_hours must be a non-negative integer.')
        this.discountedHours = hours
      }
      this.setDiscountedHours(raw.discounted_hours)


      this.setDuration = function(duration){
        if(duration < 1) throw new Error('duration must be at least 1 day.')
        this.duration = duration
      }
      this.setDuration(raw.duration_days)

      this.getDuration = function(){
        return this.duration
      }

      this.getDescription = function(){
        return this.description
      }

      this.setDescription = function(description){
        this.validateStr(description)
        this.description = description
      }
      this.setDescription(raw.description)




    } // end constructor


    TutoringPlan.getRaw = function(user_id){
      return {
        plan_id:43,
        description:'Live online tutoring',
        hours:1,
        hourly_rate:3995,
        discounted_hours:2,
        duration_days:31
      }
    }

    TutoringPlan.getFake = function(){
      return new TutoringPlan(TutoringPlan.getRaw())
    }

    return TutoringPlan;
});
