var config = new RequireTestJS(requirejs);

config.addPathTag('admin','components/admin');
config.addPathTag('specs','../test/components/admin');
config.load('../view-model-spec.js');

  // course delegator
  config.load('../course-delegator/view-model-spec.js');
  config.load('../course-delegator/admin-remote-service-spec.js');

  // tutor creator
  config.load('../tutor-creator/view-model-spec.js');
    config.load('../tutor-creator/remote-service-spec.js');
    config.load('../tutor-creator/image-store-spec.js');

  // tutor list
  config.load('../tutor-list/view-model-spec.js');
  config.load('../tutor-list/tutor-list-remote-service-spec.js');

// tutor info
  config.load('../tutor-info/view-model-spec.js');
  config.load('../tutor-info/tutor-info-remote-service-spec.js');

config.startTests();
