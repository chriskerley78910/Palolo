define(['course-docs/models/Doc',
        'people-models/Prof'],
function(Doc,
         Prof){
  var CurrentGroupDoc = function(rawDoc, host){

    Object.setPrototypeOf(this, new Doc(rawDoc, host))
    return CurrentGroupDoc;
})
