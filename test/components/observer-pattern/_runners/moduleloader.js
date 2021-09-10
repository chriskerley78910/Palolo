var configurator = new RequireTestJS(requirejs);

configurator.addPathTag('observer' ,'components/abstract-interfaces');
configurator.addPathTag('src-specs','../test/components/observer-pattern');
configurator.addPathTag('testHelper','../test/components/_test-helper');

configurator.load('src-specs/call-observer-spec');
configurator.load('src-specs/call-observable-spec');

configurator.startTests();
