({
  // by default load any Module IDs from javascript/
  baseUrl:'../src/libs/',
  waitSeconds: 1,
  paths:{

    // libs
    text               : './text',
    ko                 : './knockout-3.4.2',
    mapping            : './knockout.mapping.latest',
    'stripe'           : 'empty:',  // special entry, used when an external resource is used.
    'twilio-video'     : 'empty:',
    jquery             : './jquery-3.3.1.min',
    socketio           : './socket.io.slim',
    adapter            : './adapter-latest',
    'cleditor'         : './jquery.cleditor.min',
    'DetectRTC'        : './DetectRTC.min',
    croppie            : './croppie',
    'format-converter' : './format-converter',
    'text-utilities'   : './text-utilities',
    'window-utilities'   : './window-utilities',
    'compatibility' : './compatibility',



    // custom bindings.
    enterKey       : '../custom-bindings/enter-key',
    complementClick : '../custom-bindings/complement-click',
    sliderValue : '../custom-bindings/slider-value',

    // components

    dispatcher : '../components/dispatcher',
    'abstract-interfaces':'../components/abstract-interfaces',
    RemoteService   : '../components/remote-service/RemoteService',
    ActiveRemoteService:'../components/remote-service/DevelopmentRemoteService',
    RootViewModel   : '../RootViewModel',

    'environment' :'../components/environment',
    search:'../components/search',
    'course-groups':'../components/course-groups',


    'new-user'  : '../components/new-user',
    user : '../components/user',
      banner         : '../components/user/banner',
      notification : '../components/user/notification',
     'profile-setter': '../components/user/profile-setter',
     'user-info': '../components/user/profile-setter/view-models/user-info',
     'photo-controls': '../components/user/profile-setter/view-models/photo-controls',
     'webcam': '../components/user/profile-setter/view-models/webcam',
     'permission-error': '../components/user/profile-setter/view-models/permission-error',

     'people-store':'../components/people/people-store',
     'people-models':'../components/people/people-models',
     'class-list'  : '../components/people/class-list',
      'new-pal-list':'../components/people/new-pal-list',
     'pal-list':'../components/people/pal-list',
     'pal-request-list':'../components/people/pal-request-list',
     'people-popups':'../components/people/people-popups',
     'york-forum' : '../components/york-forum',
     'forum-poster':'../components/york-forum/poster',
     'forum-feed':'../components/york-forum/feed',
     'forum-reply':'../components/york-forum/reply',
     'forum-stats':'../components/york-forum/forum-stats',

    'course': '../components/course',
      'course-features':'../components/course/course-features',
      'tab-selector':'../components/course/tab-selector',
      'non-member-prompt' : '../components/course/prompts/non-member',
      'in-another-section-prompt' : '../components/course/prompts/in-another-section',
      'forum': '../components/course/forum',

      'course-reviews':'../components/course-reviews',
      'course-docs': '../components/course-docs',
      'doc-list-current': '../components/course-docs/doc-list-current',
      'doc-uploader': '../components/course-docs/doc-uploader',
      'payment':'../components/payment',
      'document-plans':'../components/payment/document-plans',
      'tutoring-plans':'../components/payment/tutoring-plans',
      'credit-card-info':'../components/payment/credit-card-info',
      'session-tracker':'../components/session-tracker',
      'account-info':'../components/session-tracker/account-info',
      'punch-clock':'../components/session-tracker/punch-clock',




    'right-panel': '../components/right-panel',
      'current-courses' :  '../components/right-panel/current-courses',
      'ad-views' : '../components/right-panel/ad-views',
      'course-info' : '../components/right-panel/course-info',
        'course-text-info' : '../components/right-panel/course-info/text-info',
        'course-photos'    : '../components/right-panel/course-info/course-photos',
      'file-dropper'    : '../components/right-panel/file-dropper',
      'person-info': '../components/right-panel/person-info',
      'video-chat' : '../components/video-chat',
      'tutoring-plans':'../components/payment/tutoring-plans',
      chat          : '../components/chat',
      blackboard     : '../components/blackboard',
      nav            : '../components/nav',
      auth           : "../components/auth",
      system         : "../components/system",

  },


   // things that should be loaded immediatlely BEFORE requiring anything else.
  deps: [

    'stripe',
    'twilio-video',
    'text',
    'ko',
    'mapping',
    'jquery',
    'socketio',
    'adapter',
    'DetectRTC',
    'croppie',
    'format-converter',
    'text-utilities',

    'complementClick',
    'sliderValue',

    'dispatcher/Dispatcher',
    'RootViewModel',
    'enterKey',

    'new-user/Component',
    'user/profile-setter/ProfileStore',
    'user/ProfileRemoteService',
    'banner/ViewModel',
    'profile-setter/ViewModel',
    'user-info/Component',
    'photo-controls/Component',
    'webcam/Component',
    'permission-error/Component',
    'people-store/PeopleStore',
    'notification/Component',
    'forum-poster/Component',
    'forum-feed/Component',
    'forum-reply/Component',
    'forum-stats/Component',
    'class-list/Component',
    'course-features/Component',
    'tab-selector/Component',
    'forum/Component',
    'non-member-prompt/Component',
    'in-another-section-prompt/Component',
    'course-reviews/Component',
    'course-docs/container/Component',
    'doc-list-current/Component',
    'document-plans/Component',
    'tutoring-plans/Component',
    'credit-card-info/Component',
    'session-tracker/Component',
    'punch-clock/Component',
    'account-info/Component',
    'doc-uploader/Component',
    'chat/ViewModel',
    'right-panel/Component',
    'right-panel/ad-views/pre-view/Component',
    'right-panel/ad-views/lead-view/Component',
    'right-panel/current-courses/Component',
    'right-panel/course-info/Component',
    'right-panel/course-info/text-info/Component',
    'right-panel/course-info/course-photos/Component',
    'right-panel/file-dropper/Component',
    'right-panel/person-info/Component',
    'video-chat/Component',
    'video-chat/incoming-call/Component',
    'blackboard/ViewModel',
    'auth/AuthViewModel',
    'environment/Component',
    'search/Component',
    'course-groups/Component',
    'new-pal-list/Component',
    'pal-list/Component',
    'pal-request-list/Component',
    'people-popups/Component',
    'payment/PaymentRemoteService'
  ],

  callback: function(ko,mapping){
    ko.mapping = mapping;
  },

  // for libraries that dont support the AMD standard.
  shim: {
    'socketio' : {
      exports: 'io'
    },
    // for ie to work with webRTC.
    'adapter' :{
      exports:'adapter'
    }
  },

  optimize: "none",
  name: "/var/www/palolo/src/main.js", // the "main" of the program.
  out: "../tmp/app-built.js"
})
