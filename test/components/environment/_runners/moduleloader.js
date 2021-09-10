var config = new RequireTestJS(requirejs);
config.addPathTag('environment','components/environment');
config.addPathTag('dispatcher','components/dispatcher');
config.load('./../component-spec.js');
config.startTests();
