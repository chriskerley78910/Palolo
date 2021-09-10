define([],function(){

  var Store = function(){
    this.subs = [];
    this.onPubDone = null;

    this.pub = function(){
       this.subs.forEach(function(f){
         f();
       });
       if(typeof this.onPubDone == 'function'){
         this.onPubDone();
       }
     }
     this.pub = this.pub.bind(this);

     this.onPub = function(f){
       this.onPubDone = f;
     }
     this.onPub = this.onPub.bind(this);

     this.getDis = function(){
       return this.dis;
     }

     this.sub = function(f){
       this.subs.push(f);
     }

     this.getSubs = function(){
       return this.subs;
     }
  }

  return Store;
})
