define(['ActiveRemoteService',
        'dispatcher/Dispatcher'],
function(ActiveRemoteService,
        Dispatcher){


var NewUserRemote = function(){

    this.constructor = NewUserRemote;
    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("auth");
    this.setPath('Auth.php')
    this.dis = new Dispatcher()




}

return NewUserRemote;
})
