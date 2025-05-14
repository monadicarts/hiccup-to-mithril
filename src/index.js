import m from 'mithril';
import renderToString from 'mithril-node-render';

/**
 * Converts a Hiccup-style JavaScript data structure into a Mithril.js virtual DOM node.
 *
 * Hiccup structure: ['tag#id.class', {optionalAttrs}, ...children]
 *
 * @param {Array|String|Number|Object|null|undefined|Boolean} hiccupNode - The Hiccup node.
 *        - Array: ['tagOrComponent', {optionalAttrs}, ...children]
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

    // Process children
    // Recursively call htm for each child.
    // This builds up the array of child vnodes or primitives.
    // Mithril's m() function handles an array of children passed as the third argument.
    const children = hiccupNode.slice(childrenStartIndex).map(child => htm(child));
    
    // If tagOrComponent is a function, wrap it for mithril-node-render compatibility
    // as it might expect a .view property on components.
    if (typeof tagOrComponent === 'function' && !tagOrComponent.view && !tagOrComponent.tag /* not already a vnode or POJO component */) {
        const originalFunctionComponent = tagOrComponent; // Store the original function
        tagOrComponent = { view: () => originalFunctionComponent(attrs, children) }; // Use the stored original function
        // Attrs are now passed into the function component's view, so m() shouldn't also pass them.
        attrs = {}; 
    }
    // Call Mithril's m() to create the virtual DOM node
    // All attributes (including 'class', 'id', 'x-data', 'v-bind:foo', etc.)
    // are passed directly to Mithril.
    // Mithril handles CSS selectors in the tag string (e.g., 'div#myId.myClass').
    return m(tagOrComponent, attrs, children);
}

/**
 * Renders a Hiccup-style data structure to an HTML string using mithril-node-render.
 *
 * @async
 * @param {Array|String|Number|Object|null|undefined|Boolean} hiccupNode - The Hiccup node to render.
 * @param {Object} [options={}] - Options to pass to mithril-node-render.
 * @returns {Promise<String>} A promise that resolves to the HTML string.
 *          Returns an empty string for null, undefined, or boolean root nodes,
 *          or if rendering fails (error logged to console).
 */
async function renderHtmToHtmlString(hiccupNode, options = {}) {
    // Handle cases where the root node might not be suitable for rendering directly
    // or where htm would return a non-vnode that renderToString might not like as a root.
    if (hiccupNode === null || hiccupNode === undefined || typeof hiccupNode === 'boolean') {
        return ""; // Return empty string for these non-renderable root types
    }
    if (typeof hiccupNode === 'string' || typeof hiccupNode === 'number') {
        // For simple string/number roots, mithril-node-render expects them to be escaped.
        // However, our htm function would return them as is.
        // To be safe and consistent, we can wrap them if needed, or rely on htm->m() to handle.
        // For now, let's assume htm will produce a valid vnode or something renderToString handles.
    }

    const vdom = htm(hiccupNode);

    // If htm results in null (e.g., from an empty hiccup array `[]`),
    // mithril-node-render will produce an empty string, which is fine.
    if (vdom === null || vdom === undefined || typeof vdom === 'boolean') {
        return "";
    }

    try {
        // renderToString from mithril-node-render handles Mithril vnodes.
        return await renderToString(vdom, options);
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