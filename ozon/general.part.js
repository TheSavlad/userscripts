// tsc --allowJs --checkJs --noEmit --strict --lib dom,es2017
// @ts-check
/** @type {any} */ (window).ozon = {
  /**
   * Create <style> from object stylesheet and raw lines of css
   * @param {Record<string, Record<string, string>>} stylesheet
   * @param {...string} raw
   */
  css(stylesheet, ...raw) {
    /** @type {string[]} */
    const result = [];
    for (const [sel, styles] of Object.entries(stylesheet)) {
      result.push(`${sel} {`);
      for (const [name, value] of Object.entries(styles)) {
        result.push(`  ${name}: ${value};`);
      }
      result.push("}", "");
    }
    if (raw.length) result.push(...raw);
    const css = result.join("\n").trim();
    const element = document.createElement("style");
    element.innerText = css;
    document.head.appendChild(element);
  },
  /**
   * Create an element with props and children
   * Children can be anything and are handled recursively:
   * If array:    handle each element of it
   * If DOM Node: append child to element
   * Otherwise:   convert to string and make into Text Node
   * @param {string} elname
   * @param {Record<string, any>} props
   * @param {...any} children
   * @returns {HTMLElement}
   */
  dom(elname, props, ...children) {
    const el = document.createElement(elname);
    if (!props) props = {};
    Object.entries(props).forEach(([name, value]) => {
      /** @type {any} */ (el)[name] = value;
    });
    /**
     * @param {any} child
     * @returns {void}
     */
    function addChild(child) {
      // Recursively handle children
      if (!child) return;
      if (Array.isArray(child)) return child.forEach((x) => addChild(x));
      if (typeof child === "string")
        return addChild(document.createTextNode(child));
      if (typeof child === "object") {
        if (child instanceof Node) return void el.appendChild(child);
        return addChild(JSON.stringify(child));
      }
      addChild(String(child));
    }
    addChild(children);
    return el;
  },
  /**
   * Function for .sort(): descending order of prop
   * @param {string} prop
   * @returns {(a: any, b: any) => number}
   */
  desc(prop) {
    return (a, b) => b[prop] - a[prop];
  },
  /**
   * Function for .sort(): asscending order of prop
   * @param {string} prop
   * @returns {(a: any, b: any) => number}
   */
  asc(prop) {
    return (a, b) => a[prop] - b[prop];
  },
  /**
   * query single element from document
   * @overload
   * @param {string} selector
   * @returns {HTMLElement | null}
   */
  /**
   * query single element from root
   * @overload
   * @param {HTMLElement} root
   * @param {string} selector
   * @returns {HTMLElement | null}
   */
  /**
   * @param {string | HTMLElement} a
   * @param {string | undefined} b
   * @returns {HTMLElement | null}
   */
  $(a, b) {
    const root = typeof a === "string" ? document : a;
    const selector = typeof a === "string" ? a : /** @type {string} */ (b);
    return root.querySelector(selector);
  },
  /**
   * query all elements from document
   * @overload
   * @param {string} selector
   * @returns {HTMLElement[]}
   */
  /**
   * query all elements from root
   * @overload
   * @param {HTMLElement} root
   * @param {string} selector
   * @returns {HTMLElement[]}
   */
  /**
   * @param {string | HTMLElement} a
   * @param {string | undefined} b
   * @returns {HTMLElement[]}
   */
  $$(a, b) {
    const root = typeof a === "string" ? document : a;
    const selector = typeof a === "string" ? a : /** @type {string} */ (b);
    return Array.from(root.querySelectorAll(selector));
  },
  /**
   * console.log with prefix
   * @param  {...any} args
   */
  log(...args) {
    console.log("[OZON]", ...args);
  },
  /**
   * console.error with prefix
   * @param  {...any} args
   */
  error(...args) {
    console.error("[OZON]", ...args);
  },
  /**
   * get index of a first needle string found in haystack string
   * @param {string} haystack
   * @param {string[]} needles
   * @returns {number}
   */
  findMany(haystack, needles) {
    const rx = new RegExp(`(?:(${needles.join(")|(")}))`, "i");
    const m = rx.exec(haystack);
    if (!m) return -1;
    return m.findIndex((x, i) => i > 0 && !!x) - 1;
  },
  /**
   * Create started MutationObserver
   * @param {HTMLElement} target
   * @param {MutationObserverInit} config
   * @param {MutationCallback} callback
   * @returns {MutationObserver}
   */
  observe(target, config, callback) {
    const observer = new MutationObserver(callback);
    observer.observe(target, config);
    return observer;
  },
};
