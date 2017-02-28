import { error } from './debug';
import Hybrid from './hybrid';
import { proxy } from './proxy';
import { pascalToDash, normalizeProperty } from './utils';
import { CONTROLLER, PLUGINS, OPTIONS } from './symbols';

function bootstrap(name, Controller) {
  if (global.customElements.get(name)) {
    const ExtHybrid = global.customElements.get(name);
    if (ExtHybrid[CONTROLLER] !== Controller) {
      error(TypeError, "define: Element '%name' already defined", { name });
    } else {
      return ExtHybrid;
    }
  }

  proxy(Controller);

  const options = Controller.options || {};

  if (options.define) {
    try {
      defineHybrid(options.define); // eslint-disable-line no-use-before-define
    } catch (e) {
      error(e, "define: Invalid 'define' option");
    }
  }

  const observedAttributes = [];

  class ExtHybrid extends Hybrid {
    static get observedAttributes() { return observedAttributes; }
    static get [CONTROLLER]() { return Controller; }
    static get [OPTIONS]() { return options; }
  }

  options.properties = (options.properties || [])
    .map(normalizeProperty)
    .filter(({ property, attr }) => {
      if (process.env.NODE_ENV !== 'production' && Reflect.has(ExtHybrid.prototype, property)) {
        error(ReferenceError, "define: Property '%property' already in HTMLElement prototype chain", { property });
      }

      if (Reflect.has(Controller.prototype, property)) {
        let desc;
        let proto = Controller.prototype;
        while (!desc) {
          desc = Object.getOwnPropertyDescriptor(proto, property);
          proto = Object.getPrototypeOf(proto);
        }

        if (!desc.get && typeof desc.value === 'function') {
          Object.defineProperty(ExtHybrid.prototype, property, {
            value(...args) { return this[CONTROLLER][property](...args); },
          });

          return false;
        }
      }

      if (attr) observedAttributes.push(attr);

      return true;
    });

  const mergedOptions = Object.assign({}, options, { name });

  Object.defineProperty(ExtHybrid, PLUGINS, {
    value: (options.plugins || []).map((plugin) => {
      if (process.env.NODE_ENV !== 'production' && typeof plugin !== 'function') {
        error(TypeError, 'define: Provider must be a function: %type', { type: typeof plugin });
      }
      return plugin(mergedOptions, Controller);
    }).filter(plugin => plugin),
  });

  global.customElements.define(name, ExtHybrid);

  return ExtHybrid;
}

export default function defineHybrid(...args) {
  if (!args.length) error(TypeError, 'define: Invalid arguments');

  switch (typeof args[0]) {
    case 'object':
      return Object.keys(args[0]).reduce((acc, key) => {
        acc[key] = bootstrap(pascalToDash(key), args[0][key]);
        return acc;
      }, {});
    case 'string':
      if (args.length === 1) {
        return (Controller) => {
          bootstrap(args[0], Controller);
          return Controller;
        };
      }

      return bootstrap(...args);
    default:
      return error(TypeError, 'define: Invalid arguments');
  }
}
