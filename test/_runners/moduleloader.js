var config = new RequireTestJS(requirejs);


config.addPathTag('abstract-interfaces' ,'components/abstract-interfaces');
config.addPathTag('dispatcher' ,'components/dispatcher');

config.addPathTag('york-forum' ,'components/york-forum');

config.addPathTag('course-reviews', 'components/course-reviews')
config.addPathTag('course-groups' ,'components/course-groups');
config.addPathTag('course' ,'components/course');
config.addPathTag('notification', 'components/user/notification');
config.addPathTag('window-utilities', 'libs/window-utilities')
config.addPathTag('compatability', 'libs/compatability')

config.addPathTag('people-store' ,'components/people/people-store');
config.addPathTag('people-models' ,'components/people/people-models');
config.addPathTag('new-pal-list' ,'components/people/new-pal-list');
config.addPathTag('pal-list' ,'components/people/pal-list');
config.addPathTag('pal-request-list' ,'components/people/pal-request-list');
config.addPathTag('class-list' ,'components/people/class-list');
config.addPathTag('people-popups' ,'components/people/people-popups');

config.addPathTag('search' ,'components/search/');
config.addPathTag('right-panel', '../src/components/right-panel');
config.addPathTag('file-dropper', '../src/components/right-panel/file-dropper');
config.addPathTag('ad-views', '../src/components/right-panel/ad-views');
config.addPathTag('ad-specs', '../test/components/right-panel/ad-views');
config.addPathTag('chat','components/chat');
config.addPathTag('video-chat', '../src/components/video-chat');

config.addPathTag('new-user','components/new-user')
config.addPathTag('banner','components/user/banner');
config.addPathTag('user','components/user');
config.addPathTag('notification','components/user/notification');
config.addPathTag('profile-setter','components/user/profile-setter');
config.addPathTag('croppie','libs/croppie');
config.addPathTag('MockResponses','../test/components/people/people-store/MockResponses');
config.addPathTag('course-docs','components/course-docs');

config.addPathTag('payment' ,'components/payment');
config.addPathTag('session-tracker' ,'components/session-tracker');
config.addPathTag('account-info' ,'components/session-tracker/account-info');
config.addPathTag('punch-clock' ,'components/session-tracker/punch-clock');

config.addPathTag('RemoteService' ,'components/remote-service/RemoteService');
config.addPathTag('LiveRemoteService' ,'components/remote-service/LiveRemoteService');

config.addPathTag('auth','components/auth');

// auth
config.addPathTag('mocks','../test/components/auth/mocks');
config.load('../components/auth/view-model-spec.js');
config.load('../components/auth/0_remote-service-spec.js');
config.load('../components/auth/builder-spec.js');
config.load('../components/auth/states/0_state-spec.js');
config.load('../components/auth/states/0_signup-spec.js');
config.load('../components/auth/states/0_login-spec.js');
config.load('../components/auth/states/0_password-reset-spec.js');
config.load('../components/auth/states/0_password-reset-sent-spec.js');
config.load('../components/auth/states/0_activation-email-sent-spec.js');
config.load('../components/auth/states/1_login-spec.js');

// user stuff.
config.load('../components/new-user/view-spec.js')
config.load('../components/user/user-store-remote-service-spec.js');
config.load('../components/user/banner/view-model-spec.js');
config.load('../components/user/notification/view-model-spec.js');
config.load('../components/user/notification/notification-remote-service-spec.js');
config.load('../components/user/notification/models/unseen-msg-notification-spec.js');
config.load('../components/user/notification/models/viewed-chat-notification-spec.js');
config.load('../components/user/notification/models/forum-notification-spec.js');

// profile stuff.
config.load('../components/user/profile-setter/profile-store-spec.js');
config.load('../components/user/profile-setter/states/profile-state-spec.js');
config.load('../components/user/profile-setter/states/photo-cropper-visible-spec.js');
config.load('../components/user/profile-setter/states/profile-not-visible-spec.js');
config.load('../components/user/profile-setter/states/webcam-visible-spec.js');
config.load('../components/user/profile-setter/states/new-photo-uploaded-spec.js');
config.load('../components/user/profile-setter/states/saving-profile-photo-spec.js');
config.load('../components/user/profile-setter/states/no-face-error-spec.js');
config.load('../components/user/profile-setter/states/permission-error-spec.js');
config.load('../components/user/profile-setter/states/saving-my-info-spec.js');
config.load('../components/user/profile-setter/states/searching-major-spec.js');
config.load('../components/user/profile-setter/states/majors-found-spec.js');

// view models.
config.load('../components/user/profile-setter/view-models/permission-error/view-model-spec.js');
config.load('../components/user/profile-setter/view-models/webcam/view-model-spec.js');
config.load('../components/user/profile-setter/view-models/photo-controls/view-model-spec.js');
config.load('../components/user/profile-setter/view-models/user-info/view-model-spec.js');
config.load('../components/user/profile-setter/view-model-spec.js');


// york-forum

config.load('../components/york-forum/york-forum-remote-service-spec.js');
config.load('../components/york-forum/models/forum-post-spec.js');
config.load('../components/york-forum/models/post-reply-spec.js');
config.load('../components/york-forum/york-forum-store-spec.js');
config.load('../components/york-forum/poster/view-spec.js');
config.load('../components/york-forum/feed/view-spec.js');
config.load('../components/york-forum/reply-tree/view-spec.js');
config.load('../components/york-forum/forum-stats/view-spec.js');

// chat
config.load('../components/chat/view-model-spec.js');
config.load('../components/chat/remote-service-spec.js');
config.load('../components/chat/models/chat-message-spec.js');
config.load('../components/chat/models/outbound-message-spec.js');
config.load('../components/chat/models/inbound-message-spec.js');


config.load('../components/search/search-store-spec.js');
config.load('../components/search/search-remote-service-spec.js');
config.load('../components/search/view-model-spec.js');
config.load('../test/components/course-groups/vm-spec');
config.load('../test/components/course-groups/store-spec');


// people
config.load('../test/components/people/new-pal-list/view-spec');
config.load('../test/components/people/pal-list/view-model-spec');
config.load('../test/components/people/pal-request-list/view-model-spec');
config.load('../components/people/class-list/view-model-spec.js');
config.load('../components/people/people-popups/view-model-spec.js')
config.load('../components/people/people-store/people-remote-service-spec.js');
config.load('../components/people/people-store/people-store-spec.js');

config.load('../components/people/people-models/classmate-spec.js');
config.load('../components/people/people-models/pal-spec.js');
config.load('../components/people/people-models/prof-spec.js');
config.load('../components/people/people-models/stranger-spec.js');
config.load('../components/people/people-models/pending-pal-spec.js');
config.load('../components/people/people-models/person-spec.js');
config.load('../components/people/people-models/null-person-spec.js');
config.load('../components/people/people-models/person-collection-spec.js');

config.load('../test/libs-specs/text-utilities-spec');
config.load('../libs-specs/compatibility-spec.js');

config.load('../components/right-panel/person-info/view-model-spec.js');


config.load('../components/right-panel/current-courses/view-model-spec.js');

config.load('../components/right-panel/course-info/vm-spec.js');
config.load('../components/right-panel/course-info/course-photos/vm-spec.js');
config.load('../components/right-panel/course-info/text-info/vm-spec.js');
config.load('../components/right-panel/course-info/course-photos/photo-spec.js');


config.load('../components/right-panel/file-dropper/view-model-spec.js');
config.load('../components/right-panel/file-dropper/remote-service-spec.js');

config.load('../components/right-panel/ad-views/ad-spec.js');
config.load('../components/right-panel/ad-views/ad-store-spec.js');
config.load('../components/right-panel/ad-views/ad-remote-service-spec.js');
config.load('../components/right-panel/ad-views/pre-view/view-model-spec.js');
config.load('../components/right-panel/ad-views/lead-view/view-model-spec.js');

config.load('../test/components/video-chat/video-store-spec');
config.load('../test/components/video-chat/video-remote-service-spec');
config.load('../test/components/video-chat/view-model-spec');
config.load('../test/components/video-chat/incoming-call/view-spec');
config.load('../test/components/video-chat/web-rtc-devices-spec');

// config.load('../test/components/right-panel/video-chat/call-dialog/call-dialog-spec');
// config.load('../components/right-panel/video-chat/call-buttons/view-model-spec.js');

config.load('../test/components/course-docs/doc-store-spec');
  config.load('../test/components/course-docs/models/saved-doc-spec')
  config.load('../test/components/course-docs/models/unsaved-doc-spec')
  config.load('../test/components/course-docs/models/doc-collection-spec')
config.load('../test/components/course-docs/doc-container-spec')

config.load('../test/components/course-docs/doc-list-current-spec')
config.load('../test/components/course-docs/doc-uploader-spec')
config.load('../test/components/course-docs/remote-service-spec')

config.load('../test/components/payment/payment-remote-service-spec')
config.load('../test/components/payment/payment-store-spec')
config.load('../test/components/payment/document-plans/view-model-spec')
config.load('../test/components/payment/credit-card-info/view-model-spec')
config.load('../test/components/payment/tutoring-plans/view-model-spec')
config.load('../test/components/payment/models/tutoring-plan-spec')

config.load('../test/components/session-tracker/view-spec')
config.load('../test/components/session-tracker/session-store-spec')
config.load('../test/components/session-tracker/remote-session-spec')
config.load('../test/components/session-tracker/account-state-spec')

config.load('../test/components/session-tracker/punch-clock/view-spec')
config.load('../test/components/session-tracker/account-info/view-spec')

config.load('../components/remote-service/remote-service-spec.js');
config.load('../components/remote-service/live-remote-service-spec.js');
config.load('../components/remote-service/development-remote-service-spec.js');

config.load('../components/course-reviews/view-spec.js')
config.load('../components/course/course-features/view-model-spec.js');
config.load('../components/course/models/course-group-spec.js');
config.load('../components/course/models/course-section-spec.js');
config.load('../components/course/models/location-spec.js');
config.load('../components/course/forum/view-spec.js');
config.load('../components/course/models/forum-message-spec.js');
config.load('../components/course/models/forum-message-collection-spec.js');
config.load('../components/course/course-store-spec.js');
config.load('../components/course/tab-selector/view-spec.js');
config.load('../components/course/tab-selector/tab-selector-store-spec.js');


config.setSrcRootPath('../../src');
config.startTests();
