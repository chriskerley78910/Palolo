
// Note that requirejs is used when you want to
// 'exports' of a module to be passed as an argument to a function.
//  not the module themselves.  For example if code like this appears.
/**


in the module,  then use require,  otherwise use define.
*/
requirejs.config({
    paths: {
        'stripe' : 'https://js.stripe.com/v3?noext',
        'twilio-video' : 'https://media.twiliocdn.com/sdk/js/video/releases/2.4.0/twilio-video.min'
    }
});



require(['stripe','twilio-video'], function (stripe) {


    requirejs(['ko',
               'enterKey',
               'complementClick',
               'sliderValue',
               'RootViewModel'],

    function(ko,
             enterKey,
             complementClick,
             sliderValue,
             RootViewModel){
      ko.applyBindings(new RootViewModel());
    });

});
