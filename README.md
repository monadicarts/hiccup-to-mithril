# Hiccup-to-Mithril (htm)

A lightweight utility to convert Hiccup-style JavaScript data structures into [Mithril.js](https://mithril.js.org/) virtual DOM nodes, and render them to HTML strings for server-side rendering (SSR).

This library provides a clean, JSX-free way to define Mithril UIs using simple JavaScript arrays and objects, making it particularly useful for projects where a build step for JSX is undesirable or for developers who prefer the directness of data structures.

## Features

* Converts Hiccup arrays to Mithril vnodes.
* Supports tags, attributes (including CSS selectors in tags like `div#id.class`), and children.
* Handles Mithril components (both POJO and function components).
* Provides a utility for server-side rendering (SSR) of Hiccup structures to HTML strings.
* Transparently passes through attributes, enabling easy integration with client-side libraries (e.g., Alpine.js `x-*` attributes) and utility CSS frameworks.
* Pure ESM module.

## Installation

```bash
npm install hiccup-to-mithril
# or
yarn add hiccup-to-mithril
```

## Usage

### `htm(hiccupNode)`

Converts a Hiccup node (or a tree of Hiccup nodes) to a Mithril vnode (or a tree of vnodes).

```javascript
import m from 'mithril'; // Your project would typically have Mithril installed
import hiccupToMithril from 'hiccup-to-mithril';

const { htm } = hiccupToMithril;

// Simple tag
const vnode1 = htm(['div', { class: 'container' }, 'Hello, World!']);
// m.render(document.body, vnode1);

// Using a Mithril component
const MyComponent = {
  view: (vnode) => m('p', `Prop: ${vnode.attrs.message}`)
};
const vnode2 = htm([MyComponent, { message: 'Hello from POJO component!' }]);
// m.mount(document.getElementById('app'), { view: () => vnode2 });

// Using a function component
const MyFunctionComponent = (attrs, children) => {
  return m('h1', attrs, children);
};
const vnode3 = htm([MyFunctionComponent, { style: 'color: blue;' }, 'Title from Function Component']);
// m.render(document.getElementById('output'), vnode3);

// Nested structure
const vnode4 = htm(
  ['main',
    ['h1', 'Page Title'],
    ['section',
      ['p', 'First paragraph.'],
      ['p', 'Second paragraph with a ', ['strong', 'strong'], ' word.']
    ]
  ]
);

// Tag with CSS selector
const vnode5 = htm(['button#submit-btn.primary.large', 'Submit']);

// Primitives are passed through (useful for children)
const vnode6 = htm(['p', 'Age: ', 30, null, ['em', ' (approx)']]); // null is ignored

```

### `renderHtmToHtmlString(hiccupNode, options?)`

Renders a Hiccup node to an HTML string (useful for SSR).
```javascript
import hiccupToMithril, { m } from 'hiccup-to-mithril'; // Can also import m
const { renderHtmToHtmlString } = hiccupToMithril;

async function main() {
  const html = await renderHtmToHtmlString(
    ['article',
      { id: 'my-article' },
      ['h2', 'Article Title'],
      ['p', 'This is server-rendered content.']
    ]
  );
  console.log(html);
  // Output:
  // <article id="my-article"><h2>Article Title</h2><p>This is server-rendered content.</p></article>

  // With a function component
  const MySSRComponent = (attrs) => m('div.ssr-component', `Message: ${attrs.text}`);
  const componentHtml = await renderHtmToHtmlString([MySSRComponent, { text: 'SSR rocks!' }]);
  console.log(componentHtml);
  // Output:
  // <div class="ssr-component">Message: SSR rocks!</div>
}

main();
```

## API

### `htm(hiccupNode)`

Converts a Hiccup data structure into a Mithril.js virtual DOM node.

* **`hiccupNode`**: (`Array` | `String` | `Number` | `Object` | `null` | `undefined` | `Boolean`)
    The Hiccup node to convert.
  * **Array Format**: `['tagOrComponent', {optionalAttributesObject}, ...children]`
    * `tagOrComponent`: A string (e.g., `'div'`, `'span#id.class'`) or a Mithril component (POJO or function).
    * `optionalAttributesObject`: An object containing attributes for the element/component.
    * `...children`: Subsequent arguments are treated as children. Children can be strings, numbers, booleans (ignored if `false`, `null`, `undefined`), other Hiccup arrays, or already created Mithril vnodes.
  * **String, Number**: Treated as text nodes.
  * **Object**: If it's a Mithril component (POJO or function) or an existing Mithril vnode, it's typically passed through or used as the component/tag.
  * **`null`, `undefined`, `Boolean (false)`**: Generally ignored or result in no output for that specific node (Mithril's behavior).
* **Returns**: A Mithril vnode, or a primitive value (string, number) if that's what was passed in. Returns `null` for an empty Hiccup array `[]`.

### `renderHtmToHtmlString(hiccupNode, options = {})`

Renders a Hiccup data structure to an HTML string using `mithril-node-render`. This is an asynchronous operation.

* `hiccupNode`: The Hiccup node to render (same format as for `htm`).
* `options` (`Object`, optional): Configuration options passed directly to `mithril-node-render`. Refer to `mithril-node-render` documentation for available options.
* **Returns**: `Promise<String>` - A promise that resolves to the HTML string.
  * Returns an empty string (`""`) if the root `hiccupNode` is `null`, `undefined`, or a boolean, or if an error occurs during rendering (an error will be logged to the console).

### Re-exported `m`

The library also re-exports Mithril's `m` function for convenience, if you need direct access to it without an additional import:

```javascript
import hiccupToMithril from 'hiccup-to-mithril';
const { htm, m, renderHtmToHtmlString } = hiccupToMithril;

const vnode = htm(['div', m('p', 'Directly using re-exported m!')]);

async function exampleSSRWithM() {
  const html = await renderHtmToHtmlString(
    ['div', m('strong', 'Server-rendered with imported m')]
  );
  console.log(html);
}
exampleSSRWithM();
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
