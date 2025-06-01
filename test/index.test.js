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

    it('should handle function components as tags with props and children', () => {
        // This component expects attrs and children to be passed by the wrapper
        const MyFuncComponent = (attrs, children) => m('div', attrs, ['PREFIX-', ...children]);
        const props = { id: 'func-comp-test' };
        const hiccupChild1 = 'text child';
        const hiccupChild2 = ['em', 'hiccup child']; // A hiccup structure as a child

        const hiccupInput = [MyFuncComponent, props, hiccupChild1, hiccupChild2];
        const result = htm(hiccupInput);

        // 1. The `tag` of the resulting vnode should be the wrapper component.
        expect(result.tag).toBeInstanceOf(Object);
        expect(typeof result.tag.view).toBe('function');
        expect(result.tag).not.toBe(MyFuncComponent); // It's a new wrapper object

        // 2. The `attrs` of the resulting vnode (passed to m(Wrapper, attrs, ...)) should be empty.
        expect(result.attrs).toEqual({});

        // 3. The `children` of the resulting vnode (passed to m(Wrapper, ..., children)) are the processed children.
        const expectedProcessedChildren = [htm(hiccupChild1), htm(hiccupChild2)];
        expect(result.children).toEqual(expectedProcessedChildren);

        // 4. Inspect what the wrapper's view() function would produce.
        // The wrapper's view calls: originalFunctionComponent(originalAttrs, processedHiccupChildren)
        // originalAttrs = props
        // processedHiccupChildren = [htm(hiccupChild1), htm(hiccupChild2)]
        //                       = ['text child', m('em', ['hiccup child'])]
        const processedChildren = [htm(hiccupChild1), htm(hiccupChild2)];
        const expectedRenderFromWrapperView = MyFuncComponent(props, processedChildren);

        const actualRenderFromWrapperView = result.tag.view();
        expect(actualRenderFromWrapperView).toEqual(expectedRenderFromWrapperView);
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

    describe('Fragment Handling in htm', () => {
        it('should handle null as tag for fragment', () => {
            const result = htm([null, 'child1', ['p', 'child2']]);
            expect(result).toEqual(m('[', ['child1', m('p', ['child2'])]));
        });

        it('should handle undefined as tag for fragment', () => {
            const result = htm([undefined, 'child1']);
            expect(result).toEqual(m('[', ['child1']));
        });

        it('should handle empty string as tag for fragment', () => {
            const result = htm(['', 'child1']);
            expect(result).toEqual(m('[', ['child1']));
        });

        it('should handle fragment with attributes (e.g., key)', () => {
            const result = htm([null, { key: 'my-fragment' }, 'content']);
            expect(result).toEqual(m('[', { key: 'my-fragment' }, ['content']));
        });
    });

    describe('Nested Array as Tag in htm', () => {
        it('should handle an empty array as tag (becomes fragment)', () => {
            // [[]] -> htm([]) -> null (as tag) -> '['
            const result = htm([[]]);
            expect(result).toEqual(m('[', [])); // An empty fragment
        });

        it('should handle [[]] with children (becomes fragment with children)', () => {
            const result = htm([[], 'child']);
            expect(result).toEqual(m('[', ['child']));
        });

        it('should handle a nested null tag (becomes fragment)', () => {
            // [[null]] -> htm([null]) which calls htm(null) internally for the tag part.
            // htm([null]) -> tagOrComponent = null -> becomes '['. Children are [].
            const result = htm([[null]]);
            expect(result).toEqual(m('[', []));
        });
    });

    describe('Attribute Detection Robustness in htm', () => {
        it('should treat a Mithril vnode in attribute position as a child', () => {
            const innerVnode = m('span', 'inner');
            const result = htm(['div', innerVnode, 'text']);
            expect(result).toEqual(m('div', [innerVnode, 'text']));
        });
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

    it('should render an empty string for an empty hiccup array root htm([])', async () => {
        const html = await renderHtmToHtmlString([]); // htm([]) is null
        expect(html).toBe('');
    });

    it('should render an empty string for htm([[]]) as root', async () => {
        // htm([[]]) -> htm(htm([])) -> htm(null) -> null
        const html = await renderHtmToHtmlString([[]]);
        expect(html).toBe('');
    });

    describe('Rendering Lists of Hiccup Roots', () => {
        it('should render an array of simple Hiccup structures as siblings', async () => {
            const hiccupList = [
                ['div', 'First div'],
                ['p', 'Second paragraph']
            ];
            const html = await renderHtmToHtmlString(hiccupList);
            expect(html).toBe('<div>First div</div><p>Second paragraph</p>');
        });

        it('should render an array of complex Hiccup structures', async () => {
            const hiccupList = [
                ['div', { id: 'one' }, ['span', 'Content One']],
                ['article', ['h2', 'Title'], ['p', 'Text here']]
            ];
            const html = await renderHtmToHtmlString(hiccupList);
            expect(html).toBe('<div id="one"><span>Content One</span></div><article><h2>Title</h2><p>Text here</p></article>');
        });

        it('should handle an array of roots containing null/empty hiccup items', async () => {
            const hiccupList = [['div', 'First'], null, [], ['p', 'Last']];
            const html = await renderHtmToHtmlString(hiccupList);
            expect(html).toBe('<div>First</div><p>Last</p>');
        });

        it('should handle an array of roots where all items resolve to null or undefined', async () => {
            const hiccupList = [null, [], undefined];
            const html = await renderHtmToHtmlString(hiccupList);
            expect(html).toBe('');
        });

        it('should render an array of fragments as siblings', async () => {
            const hiccupList = [[null, 'Frag1 ', ['em', 'emph']], ['', 'Frag2']];
            const html = await renderHtmToHtmlString(hiccupList);
            expect(html).toBe('Frag1 <em>emph</em>Frag2');
        });
    });

    describe('Rendering Fragments to String', () => {
        it('should render a simple fragment to string', async () => {
            const html = await renderHtmToHtmlString([null, 'Hello', ' ', 'fragment!']);
            expect(html).toBe('Hello fragment!');
        });
    });

    it('should render function components with children correctly to string', async () => {
        const MyFuncComponent = (attrs, children) => m('div', attrs, ['Prefix: ', ...children]);
        const html = await renderHtmToHtmlString([MyFuncComponent, { class: 'test' }, 'Child 1', ['strong', 'Child 2']]);
        expect(html).toBe('<div class="test">Prefix: Child 1<strong>Child 2</strong></div>');
    });
});