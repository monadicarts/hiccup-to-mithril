import m from 'mithril';
import renderToString from 'mithril-node-render';

/**
 * Converts a Hiccup-style JavaScript data structure into a Mithril.js virtual DOM node.
 *
 * Hiccup structure: ['tag#id.class', {optionalAttrs}, ...children]
 * or for fragments: [null||undefined||'', {optionalAttrs}, ...children]
 *
 * @param {Array|String|Number|Object|null|undefined|Boolean} hiccupNode - The Hiccup node.
 *        - Array: ['tagOrComponent', {optionalAttrs}, ...children]
 *          'tagOrComponent' can be:
 *            - A string CSS selector (e.g., 'div#id.my-class').
 *            - A Mithril component object (e.g., {view: () => ...}) or a class component.
 *            - A function. If not a Mithril component, it's treated as a simple view function: (attributes, childrenVnodes) => MithrilVnode.
 *            - null, undefined, or an empty string ('') to represent a document fragment (translates to Mithril's '[' selector).
 *        - String/Number/Boolean: Treated as a text node.
 *        - Object: If it's a Mithril component or an existing vnode, it's passed through.
 *        - null/undefined: Ignored.
 * @returns {Object|String|Number|null} A Mithril vnode, or a primitive/null value.
 */
function htm(hiccupNode) {
  // Handle non-array inputs (primitives, components, existing vnodes)
  if (!Array.isArray(hiccupNode)) {
    // Pass through strings, numbers, booleans, null, undefined, Mithril components, or existing vnodes directly.
    // Mithril's m() handles these appropriately when they are children.
    return hiccupNode;
  }

  // Handle empty Hiccup array (e.g., an empty conditional block)
  if (hiccupNode.length === 0) {
    return null; // Mithril treats null children as empty
  }

  // Destructure the Hiccup array
  let tagOrComponent = hiccupNode[0];
  let attrs = {};
  let childrenStartIndex = 1;

  // Check for an attributes object
  // It must be a plain object and not an array (which would be a child)
  // and not a Mithril vnode (which would also be a child or component).
  if (hiccupNode.length > 1 && typeof hiccupNode[1] === 'object' &&
    hiccupNode[1] !== null && !Array.isArray(hiccupNode[1]) &&
    // Check if it's not already a vnode or a POJO component
    !('tag' in hiccupNode[1]) && !('view' in hiccupNode[1])) {
    attrs = hiccupNode[1];
    childrenStartIndex = 2;
  }

  // If tagOrComponent is an array (but not a Mithril POJO component, which has a .view),
  // it's a nested Hiccup structure that needs to be resolved first.
  // e.g., [['div', 'inner'], 'outer child'] -> htm(['div', 'inner']) becomes the tag.
  if (Array.isArray(tagOrComponent) && typeof tagOrComponent.view !== 'function') {
    tagOrComponent = htm(tagOrComponent);
  }

  // Handle fragments: if tagOrComponent is null, undefined, or '', treat as Mithril fragment
  if (tagOrComponent === null || tagOrComponent === undefined || tagOrComponent === '') {
    tagOrComponent = '['; // Mithril's fragment selector
    // Attributes on a fragment (e.g., for keys) will be passed to m('[', attrs, children).
    // Mithril's m('[', attrs, children) supports this.
  }

  // Process children
  // Recursively call htm for each child.
  // This builds up the array of child vnodes or primitives.
  // Mithril's m() function handles an array of children passed as the third argument.
  const children = hiccupNode.slice(childrenStartIndex).map(child => htm(child));

  // If tagOrComponent is a function, wrap it for mithril-node-render compatibility
  // as it might expect a .view property on components.
  if (typeof tagOrComponent === 'function' && !tagOrComponent.view && !tagOrComponent.tag /* not already a vnode or POJO component */) {
    const originalFunctionComponent = tagOrComponent; // Store the original function
    const attributesForComponent = attrs; // Capture the attributes intended for the component
    // The 'children' variable is already the array of processed child vnodes/primitives from the map operation above.
    tagOrComponent = {
      view: () => originalFunctionComponent(attributesForComponent, children)
    };
    // Attrs are now passed into the function component's view, so m() shouldn't also pass them.
    attrs = {};
  }
  // Call Mithril's m() to create the virtual DOM node
  // All attributes (including 'class', 'id', 'x-data', 'v-bind:foo', etc.)
  // are passed directly to Mithril.
  // Mithril handles CSS selectors in the tag string (e.g., 'div#myId.myClass').
  // If tagOrComponent resolved to a vnode and there are no further attrs/children from this level, return it directly.
  if (typeof tagOrComponent === 'object' && tagOrComponent !== null && 'tag' in tagOrComponent &&
    Object.keys(attrs).length === 0 && children.length === 0) {
    return tagOrComponent;
  }
  return m(tagOrComponent, attrs, children);
}

/**
 * Renders a Hiccup-style data structure to an HTML string using mithril-node-render.
 *
 * @async
 * @param {Array|String|Number|Object|null|undefined|Boolean} hiccupNode - The Hiccup node to render.
 *          or an array of Hiccup nodes (e.g., [['div'], ['p']]) to be rendered as siblings.
 * @param {Object} [options={}] - Options to pass to mithril-node-render.
 * @returns {Promise<String>} A promise that resolves to the HTML string.
 *          Returns an empty string for null, undefined, or boolean root nodes,
 *          or if rendering fails (error logged to console).
 */
async function renderHtmToHtmlString(hiccupNode, options = {}) {
  // Handle non-renderable root types early.
  if (hiccupNode === null || hiccupNode === undefined || typeof hiccupNode === 'boolean') {
    return ""; // Return empty string for these non-renderable root types
  }

  let vdomRoot;

  // Heuristic: If hiccupNode is an array and its first element is also an array,
  // treat hiccupNode as a list of Hiccup structures to be rendered as siblings.
  // This distinguishes [['div'], ['p']] (list of roots)
  // from ['div', ['p']] (single root with child).
  // An empty array `[]` as hiccupNode will fall into the 'else' block.
  if (Array.isArray(hiccupNode) && hiccupNode.length > 0 && Array.isArray(hiccupNode[0])) {
    vdomRoot = hiccupNode.map(item => htm(item));
  } else {
    // Standard case: hiccupNode is a single Hiccup structure,
    // or a primitive value, or an empty array [].
    vdomRoot = htm(hiccupNode);
  }

  // If htm (or mapping htm) results in null (e.g., from `htm([])`),
  // or if vdomRoot became an array of nulls (e.g. `htm([[]])` -> `[null]`),
  // or a primitive boolean, renderToString will typically produce an empty string.
  // This check ensures consistent empty string return for these cases.
  if (vdomRoot === null || vdomRoot === undefined || typeof vdomRoot === 'boolean') {
    return "";
  }

  try {
    // renderToString handles single vnodes, arrays of vnodes, strings, numbers.
    // It returns "" for null, undefined, booleans, [null], [undefined], [true], [false].
    return await renderToString(vdomRoot, options);
  } catch (error) {
    console.error("Mithrilicup.renderHtmToHtmlString: Error during server-side rendering:", error);
    // Provide a safe error message in the HTML output for debugging.
    // In production, you might want to throw the error or handle it differently.
    return ``;
  }
}

export default {
  htm,
  renderHtmToHtmlString,
  m: m // Re-export Mithril's m for users who might need direct access or for advanced component patterns
};