


define([],function(){


  var MockResponses = function(){


     this.getMockResponse = function(){
       return [
         {
           first:"Lino",
           last:"Kearney",
           isOnline:true,
           allMsgsSeen:false
         },
         {
           first:"David",
           last:"Kearney",
           isOnline:false,
           allMsgsSeen:true
         },
         {
          first:"Chris",
          last:"Kerley",
          isOnline:false,
          allMsgsSeen:true
         }
       ];
     }
    }

       return MockResponses;

}); // end define.
