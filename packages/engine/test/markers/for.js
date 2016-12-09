import { define } from '@hybrids/core';
import engine from '../../src/engine';
import { getOwnLocals, LOCALS_PREFIX as L } from '../../src/expression';
import { PROPERTY_PREFIX as P, MARKER_PREFIX as M } from '../../src/template';

describe('Engine | Markers | For -', () => {
  let el;

  function extractValues() {
    return Array.from(el.shadowRoot.querySelectorAll('[data-value]')).map(
      node => node.textContent
    );
  }

  afterEach(() => {
    document.body.removeChild(el);
  });

  describe('one array instance', () => {
    class EngineForeachTest {
      static get options() {
        return {
          use: [engine],
          properties: ['items'],
          template: `
            <template ${M}for="items">
              <div ${P}text-content="${L}item" data-value hidden></div>
              <span hidden>test</span>
            </template>
          `
        };
      }

      constructor() {
        this.items = ['4', '2', '3', '1'];
      }
    }

    beforeAll(() => {
      define({ EngineForeachTest });
    });

    beforeEach(() => {
      el = document.createElement('engine-foreach-test');
      document.body.appendChild(el);
    });

    rafIt('initial items list', () => {
      expect(extractValues()).toEqual(['4', '2', '3', '1']);
    });

    rafIt('initial locals', () => {
      expect(getOwnLocals(el.shadowRoot.children[0])).toEqual({
        number: 1,
        first: true,
        last: false,
        odd: true,
        even: false,
        item: '4',
        index: 0,
        length: 4,
        key: '0',
      });
      expect(getOwnLocals(el.shadowRoot.children[2])).toEqual({
        number: 2,
        first: false,
        last: false,
        odd: false,
        even: true,
        item: '2',
        index: 1,
        length: 4,
        key: '1',
      });
    });

    rafIt('shift item locals', () => {
      el.items.shift();
      requestAnimationFrame(() => {
        expect(getOwnLocals(el.shadowRoot.children[0])).toEqual({
          number: 1,
          first: true,
          last: false,
          odd: true,
          even: false,
          item: '2',
          index: 0,
          length: 3,
          key: '0',
        });
        expect(getOwnLocals(el.shadowRoot.children[2])).toEqual({
          number: 2,
          first: false,
          last: false,
          odd: false,
          even: true,
          item: '3',
          index: 1,
          length: 3,
          key: '1',
        });
      });
    });

    rafIt('pop item', () => {
      el.items.pop();
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['4', '2', '3']);
      });
    });

    rafIt('shift item', () => {
      el.items.shift();
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['2', '3', '1']);
      });
    });

    rafIt('unshift item', () => {
      el.items.unshift('6');
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['6', '4', '2', '3', '1']);
      });
    });

    rafIt('sort item', () => {
      el.items.sort();
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['1', '2', '3', '4']);
      });
    });

    rafIt('replace with add item', () => {
      el.items = ['2', '2', '1', '4'];
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['2', '2', '1', '4']);
      });
    });

    rafIt('replace', () => {
      el.items = ['2', '2', '1'];
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['2', '2', '1']);
      });
    });

    rafIt('empty with length', () => {
      el.items.length = 0;
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual([]);
      });
    });

    rafIt('empty with new instance', () => {
      el.items = [];
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual([]);
      });
    });

    rafIt('push items', () => {
      el.items.push('1', '2', '3');
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['4', '2', '3', '1', '1', '2', '3']);
      });
    });

    it('multiple stage splice', (done) => {
      requestAnimationFrame(() => {
        el.items.push('1', '2', '3');
        requestAnimationFrame(() => {
          el.items.splice(3, 2);

          requestAnimationFrame(() => {
            expect(extractValues()).toEqual(['4', '2', '3', '2', '3']);
            done();
          });
        });
      });
    });

    it('multiple stage sort', (done) => {
      requestAnimationFrame(() => {
        el.items.push('1', '2', '3');
        requestAnimationFrame(() => {
          el.items.sort();

          requestAnimationFrame(() => {
            expect(extractValues()).toEqual(['1', '1', '2', '2', '3', '3', '4']);
            done();
          });
        });
      });
    });
  });

  describe('nested array instances', () => {
    class EngineForeachTestMultiply {
      static get options() {
        return {
          use: [engine],
          properties: ['items'],
          template: `
            <template ${M}for="items">
              <template ${M}for="value: ${L}item.values">
                <div data-value ${P}item="${L}item">{{ ${L}value }}</div>
              </template>
              <span>some static text</span>
            </template>
          `
        };
      }

      constructor() {
        this.items = [
          { values: ['1', '2', '3'] },
          { values: ['4', '5', '6'] },
          { values: ['7', '8', '9'] },
        ];
      }
    }

    beforeAll(() => {
      define({ EngineForeachTestMultiply });
    });

    beforeEach(() => {
      el = document.createElement('engine-foreach-test-multiply');
      document.body.appendChild(el);
    });

    rafIt('render initial items', () => {
      expect(extractValues()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });

    rafIt('pop item', () => {
      el.items.pop();
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['1', '2', '3', '4', '5', '6']);
      });
    });

    rafIt('shift item', () => {
      el.items.shift();
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['4', '5', '6', '7', '8', '9']);
      });
    });

    rafIt('unshift item', () => {
      el.items.unshift({ values: ['10'] });
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['10', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
      });
    });

    rafIt('sort item', () => {
      el.items.sort((a, b) => b.values[0] - a.values[0]);
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['7', '8', '9', '4', '5', '6', '1', '2', '3']);
      });
    });

    rafIt('empty with length', () => {
      el.items.length = 0;
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual([]);
      });
    });

    rafIt('merge locals with parent for', () => {
      const { item, index, value } = getOwnLocals(el.shadowRoot.children[4]);
      expect(item).toEqual(el.items[1]);
      expect(index).toEqual(0);
      expect(value).toEqual('4');
    });
  });

  describe('one object instance', () => {
    class EngineForeachObjectTest {
      static get options() {
        return {
          use: [engine],
          properties: ['items'],
          template: `
            <template ${M}for="items">
              <div ${P}text-content="${L}item" data-value hidden></div>
              <span hidden>test</span>
            </template>
          `
        };
      }

      constructor() {
        this.items = { a: 'a', c: 'c', b: 'b' };
      }
    }

    beforeAll(() => {
      define({ EngineForeachObjectTest });
    });

    beforeEach(() => {
      el = document.createElement('engine-foreach-object-test');
      document.body.appendChild(el);
    });

    rafIt('initial items list', () => {
      expect(extractValues()).toEqual(['a', 'c', 'b']);
    });

    rafIt('initial locals', () => {
      expect(getOwnLocals(el.shadowRoot.children[1])).toEqual({
        number: 1,
        first: true,
        last: false,
        odd: true,
        even: false,
        item: 'a',
        index: 0,
        length: 3,
        key: 'a',
      });
      expect(getOwnLocals(el.shadowRoot.children[3])).toEqual({
        number: 2,
        first: false,
        last: false,
        odd: false,
        even: true,
        item: 'c',
        index: 1,
        length: 3,
        key: 'c',
      });
    });

    rafIt('delete property', () => {
      delete el.items.c;
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['a', 'b']);
      });
    });

    rafIt('added property', () => {
      el.items.newProperty = 'test';
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['a', 'c', 'b', 'test']);
      });
    });

    rafIt('replace the same', () => {
      const elements = Array.from(el.shadowRoot.querySelectorAll('[data-value]'));
      el.items = { a: 'a', c: 'c', b: 'b' };
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['a', 'c', 'b']);
        expect(elements).toEqual(Array.from(el.shadowRoot.querySelectorAll('[data-value]')));
      });
    });

    rafIt('replace without property', () => {
      el.items = { a: 'a', b: 'b' };
      requestAnimationFrame(() => {
        expect(extractValues()).toEqual(['a', 'b']);
      });
    });
  });
});