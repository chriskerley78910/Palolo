var config = new RequireTestJS(requirejs);
config.setSrcRootPath('../../../../../src/');

config.addPathTag('non-member',        'components/course/prompts/non-member');
config.addPathTag('in-another-section','components/course/prompts/in-another-section');
config.addPathTag('text-utilities','libs/text-utilities');
config.addPathTag('course','components/course');
config.addPathTag('dispatcher', 'components/dispatcher');


config.load('../non-member-vm-spec.js');
config.load('../in-another-section-vm-spec.js');

config.startTests();
