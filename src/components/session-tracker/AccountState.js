/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['abstract-interfaces/ValidObject'],
function(ValidObject){

  var AccountState = function(data){

    Object.setPrototypeOf(this,new ValidObject())

    this.setTimeRemaining = function(remaining){
      if(typeof remaining != 'number' || remaining < 0)
        throw new Error('remaining time must be a non-negative number.')
      this.remaining = remaining
    }
    this.setTimeRemaining(data.remaining)


    this.getTimeRemaining = function(){
      return this.remaining
    }


    this.setTimeFulfilled = function(time){
      if(typeof time != 'number' || time < 0)
        throw new Error('remaining time must be a non-negative number.')
        this.fulfilled = time;
    }
    this.setTimeFulfilled(data.fulfilled)

    this.getTimeFulfilled = function(){
      return this.fulfilled
    }

    this.setCustomerId = function(id){
      this.validateId(id)
      this.customerId = id
    }
    this.setCustomerId(data.customer_id)

    this.getCustomerId = function(){
      return this.customerId
    }

  };

  AccountState.getRaw = function(){
    return {
      customer_id:1,
      remaining:2,
      fulfilled:3
    }
  }

  AccountState.getFake = function(){
    var raw = AccountState.getRaw()
    return new AccountState(raw)
  }
  return AccountState

});
