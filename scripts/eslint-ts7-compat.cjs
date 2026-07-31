const Module = require('module');
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === 'typescript') {
    return originalLoad.call(this, 'typescript6', parent, isMain);
  }
  return originalLoad.call(this, request, parent, isMain);
};
