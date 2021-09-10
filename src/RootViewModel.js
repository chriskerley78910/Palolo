
define(['ko','enterKey', "jquery",'complementClick'],
function(ko, enterKey, $, complementClick){


  ko.options.deferUpdates = true;

  ko.components.register('environment',    {require:'environment/Component'});
  ko.components.register('auth',                  {require:'auth/AuthViewModel'});

  ko.components.register('forum-reply',        {require:'forum-reply/Component'});
  ko.components.register('forum-poster',        {require:'forum-poster/Component'});
  ko.components.register('forum-feed',        {require:'forum-feed/Component'});
  ko.components.register('forum-stats',        {require:'forum-stats/Component'});
  ko.components.register('session-tracker',        {require:'session-tracker/Component'});
  ko.components.register('account-info',        {require:'account-info/Component'});
  ko.components.register('punch-clock',        {require:'punch-clock/Component'});
  ko.components.register('profile-setter',        {require:'profile-setter/ViewModel'});
  ko.components.register('user-info',             {require:'user-info/Component'});
  ko.components.register('profile-webcam',        {require:'webcam/Component'});
  ko.components.register('permission-error',      {require:'permission-error/Component'});
  ko.components.register('photo-controls',        {require:'photo-controls/Component'});

  ko.components.register('new-user', {require:'new-user/Component'})
  ko.components.register('banner',                {require:'banner/ViewModel'});
  ko.components.register('notification',          {require:'notification/Component'});


  ko.components.register('search',                {require:'search/Component'});
  ko.components.register('course-groups',           {require:'course-groups/Component'});
  ko.components.register('course-reviews',           {require:'course-reviews/Component'});

  // people.
  ko.components.register('new-pal-list',          {require:'new-pal-list/Component'});
  ko.components.register('pal-list',          {require:'pal-list/Component'});
  ko.components.register('pal-request-list',  {require:'pal-request-list/Component'});
  ko.components.register('class-list',       {require:'class-list/Component'});
  ko.components.register('people-popups',       {require:'people-popups/Component'});


  ko.components.register('course-features',       {require:'course-features/Component'});
    ko.components.register('non-member-prompt',   {require:'non-member-prompt/Component'});
    ko.components.register('in-another-section-prompt',   {require:'in-another-section-prompt/Component'});
    ko.components.register('forum',               {require:'forum/Component'});
    ko.components.register('course-settings',      {require:'course-settings/Component'});
    ko.components.register('tab-selector',      {require:'tab-selector/Component'});
    ko.components.register('course-docs',      {require:'course-docs/container/Component'});
    ko.components.register('doc-list', {require:'doc-list/Component'});
    ko.components.register('doc-list-current', {require:'doc-list-current/Component'});
    ko.components.register('doc-uploader',      {require:'doc-uploader/Component'});
      ko.components.register('doc-attr',      {require:'doc-attr/Component'});

    ko.components.register('document-plans',      {require:'document-plans/Component'});
    ko.components.register('credit-card-info',     {require:'credit-card-info/Component'});
  // one on one stuff.
  ko.components.register('chat-widget',           {require:'chat/ViewModel'});
  ko.components.register('blackboard',            {require:'blackboard/ViewModel'});



  ko.components.register('right-panel',     {require:'right-panel/Component'});

    ko.components.register('current-courses', {require:'right-panel/current-courses/Component'});

    ko.components.register('pre-view',       {require:'right-panel/ad-views/pre-view/Component'});
      ko.components.register('lead-view',       {require:'right-panel/ad-views/lead-view/Component'});

    ko.components.register('course-info',     {require:'right-panel/course-info/Component'});
      ko.components.register('course-photos',        {require:'right-panel/course-info/course-photos/Component'});
      ko.components.register('course-text-info',     {require:'right-panel/course-info/text-info/Component'});

    ko.components.register('file-dropper',    {require:'right-panel/file-dropper/Component'});
    ko.components.register('person-info',     {require:'right-panel/person-info/Component'});
    ko.components.register('video-chat',      {require:'video-chat/Component'});
    ko.components.register('incoming-call',      {require:'video-chat/incoming-call/Component'});
    ko.components.register('tutoring-plans',     {require:'tutoring-plans/Component'})


  return function RootViewModel(){
  };
});
