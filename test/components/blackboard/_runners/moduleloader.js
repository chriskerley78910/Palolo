var config = new RequireTestJS(requirejs);
config.addPathTag('blackboard','components/blackboard');
config.addPathTag('dispatcher','components/dispatcher');
config.addPathTag('window-utilities', 'libs/window-utilities')
config.addPathTag('compatability', 'libs/compatability')
config.addPathTag('abstract-interfaces', 'components/abstract-interfaces')

config.load('./../models/remote-erase-spec.js');
config.load('./../models/pencil-line-spec.js');
config.load('./../models/erase-spec.js');
// config.load('./../blackboard-remote-service-spec.js');
config.load('./../view-model-spec.js');
config.load('./../canvas/canvas-spec.js');
config.load('./../canvas/layer-spec.js');
config.load('./../canvas/tool-layer-spec.js');
config.load('./../canvas/drawing-layer-spec.js');
config.load('./../blackboard-collection-spec.js');
config.load('./../black-board-spec.js');
config.load('./../blackboard-store-spec.js');
config.startTests();
