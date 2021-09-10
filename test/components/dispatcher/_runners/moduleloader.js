var config = new RequireTestJS(requirejs);
config.addPathTag('dispatcher','components/dispatcher');
config.load('../dispatcher-spec.js');
config.startTests();
