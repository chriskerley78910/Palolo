var config = new RequireTestJS(requirejs);
config.addPathTag('course' ,'components/course/');
config.addPathTag('section-selector' ,'components/course/section-selector/');
config.addPathTag('dispatcher', 'components/dispatcher');
config.load('./../view-model-spec.js');
config.setSrcRootPath('../../../../../src/');
config.startTests();
