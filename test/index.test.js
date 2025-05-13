import m from 'mithril';
// Import the default export and then destructure
import hiccupToMithril from '../src/index.js';
const { htm, renderHtmToHtmlString } = hiccupToMithril;


describe('htm', () => {
    it('should pass through non-array inputs directly', () => {
        expect(htm('string')).toBe('string');
        expect(htm(123)).toBe(123);
        const component = { view: () => m('div') };
        expect(htm(component)).toBe(component);
        const vnode = m('div');
        expect(htm(vnode)).toBe(vnode);
    });

    it('should handle an empty Hiccup array', () => {
        expect(htm([])).toBe(null);
    });

    it('should handle a simple tag with no attributes or children', () => {
        const result = htm(['div']);
        expect(result).toEqual(m('div'));
    });

    it('should handle a tag with attributes but no children', () => {
        const result = htm(['div', { id: 'test', class: 'my-class' }]);
        expect(result).toEqual(m('div', { id: 'test', class: 'my-class' }));
    });

    it('should handle a tag with children but no attributes', () => {
        const result = htm(['div', 'child1', 'child2']);
        expect(result).toEqual(m('div', ['child1', 'child2']));
    });

    it('should handle a tag with attributes and children', () => {
        const result = htm(['div', { id: 'test' }, 'child1', 'child2']);
        expect(result).toEqual(m('div', { id: 'test' }, ['child1', 'child2']));
    });

    it('should handle nested Hiccup structures', () => {
        const result = htm(['div', { class: 'outer' }, ['p', 'inner text']]);
        expect(result).toEqual(m('div', { class: 'outer' }, [m('p', ['inner text'])]));
    });

    it('should handle tags with null attributes', () => {
        const result = htm(['div', { id: null }, 'content']);
        expect(result).toEqual(m('div', { id: null }, ['content']));
    });

    it('should handle tags with undefined attributes', () => {
        const result = htm(['div', { data: undefined }, 'content']);
        expect(result).toEqual(m('div', { data: undefined }, ['content']));
    });

    it('should handle tags with boolean attributes', () => {
        const result = htm(['input', { disabled: true, checked: false }]);
        expect(result).toEqual(m('input', { disabled: true, checked: false }));
    });

    it('should handle components as tags', () => {
        const MyComponent = { view: () => m('span', 'Component content') };
        const result = htm([MyComponent, { prop: 'value' }]);
        expect(result).toEqual(m(MyComponent, { prop: 'value' }));
    });

// In /home/justin/repos/htm/test/index.test.js
it('should handle function components as tags', () => {
    const MyComponent = () => m('span', 'Function Component');
    const props = { prop: 'value' };
    const result = htm([MyComponent, props]);

    // Expect the tag to be an object with a view method
    expect(result.tag).toBeInstanceOf(Object);
    expect(typeof result.tag.view).toBe('function');
    // And the attrs passed to m() for the wrapper should be empty
    expect(result.attrs).toEqual({});

    // To be absolutely sure, you could even render it and check the output,
    // though renderHtmToHtmlString already covers this.
    // For example, if you wanted to check the internal call:
    // const renderedContent = result.tag.view(); // This would call MyComponent(props, [])
    // expect(renderedContent).toEqual(m('span', 'Function Component'));
});

    it('should handle nested arrays as children', () => {
        const result = htm(['div', ['p', 'text1'], ['span', 'text2']]);
        expect(result).toEqual(m('div', [m('p', ['text1']), m('span', ['text2'])]));
    });

    it('should correctly interpret CSS selectors in tag names', () => {
        const result = htm(['div#my-id.my-class', 'content']);
        expect(result).toEqual(m('div#my-id.my-class', ['content']));
    });

    it('should handle components with key attribute', () => {
        const MyComponent = { view: () => m('div') };
        const result = htm([MyComponent, { key: 'unique-key' }]);
        expect(result).toEqual(m(MyComponent, { key: 'unique-key' }));
    });

    it('should handle elements with event handlers as attributes', () => {
        const onClick = jest.fn();
        const result = htm(['button', { onclick: onClick }, 'Click me']);
        expect(result).toEqual(m('button', { onclick: onClick }, ['Click me']));
    });

    it('should handle elements with data attributes', () => {
        const result = htm(['div', { 'data-value': 'test' }, 'content']);
        expect(result).toEqual(m('div', { 'data-value': 'test' }, ['content']));
    });

    it('should handle SVG elements correctly', () => {
        const result = htm(['svg', { width: '100', height: '100' }, ['circle', { cx: '50', cy: '50', r: '40' }]]);
        expect(result).toEqual(m('svg', { width: '100', height: '100' }, [m('circle', { cx: '50', cy: '50', r: '40' })]));
    });
});

describe('renderHtmToHtmlString', () => {
    it('should render a simple Hiccup structure to an HTML string', async () => {
        const html = await renderHtmToHtmlString(['div', 'Hello, World!']);
        expect(html).toBe('<div>Hello, World!</div>');
    });

    it('should render a structure with attributes', async () => {
        const html = await renderHtmToHtmlString(['p', { class: 'greeting' }, 'Welcome!']);
        expect(html).toBe('<p class="greeting">Welcome!</p>');
    });

    it('should render a nested structure', async () => {
        const html = await renderHtmToHtmlString(['div', ['h1', 'Title'], ['p', 'Content']]);
        expect(html).toBe('<div><h1>Title</h1><p>Content</p></div>');
    });

    it('should handle components', async () => {
        const MyComponent = { view: () => m('span', 'Component Content') };
        const html = await renderHtmToHtmlString([MyComponent]);
        expect(html).toBe('<span>Component Content</span>');
    });

    it('should handle function components', async () => {
        const MyComponent = () => m('span', 'Function Component Content');
        const html = await renderHtmToHtmlString([MyComponent]);
        expect(html).toBe('<span>Function Component Content</span>');
    });

    it('should render empty string for null root', async () => {
        const html = await renderHtmToHtmlString(null);
        expect(html).toBe('');
    });

    it('should render empty string for undefined root', async () => {
        const html = await renderHtmToHtmlString(undefined);
        expect(html).toBe('');
    });

    it('should render empty string for boolean root', async () => {
        const html = await renderHtmToHtmlString(true);
        expect(html).toBe('');
    });

    it('should render correctly with CSS selectors in tag names', async () => {
        const html = await renderHtmToHtmlString(['div#my-id.my-class', 'Content']);
        expect(html).toBe('<div id="my-id" class="my-class">Content</div>');
    });

    it('should handle more complex attributes, including event handlers (though SSR output might not fully reflect handlers)', async () => {
        const onClick = jest.fn();
        const html = await renderHtmToHtmlString(['button', { onclick: onClick, 'data-test': 'value' }, 'Click Me']);
        expect(html).toBe('<button data-test="value">Click Me</button>'); // onclick not directly reflected in SSR output
    });

    it('should handle SVG elements', async () => {
        const html = await renderHtmToHtmlString(['svg', { width: '100', height: '100' }, ['circle', { cx: '50', cy: '50', r: '40' }]]);
        expect(html).toBe('<svg width="100" height="100"><circle cx="50" cy="50" r="40"></circle></svg>');
    });

    it('should render a list of elements', async () => {
      const html = await renderHtmToHtmlString(['ul',
          ['li', 'Item 1'],
          ['li', 'Item 2'],
          ['li', 'Item 3']
      ]);
      expect(html).toBe('<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>');
    });
});