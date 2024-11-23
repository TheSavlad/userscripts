window.ozon = {
    // create <style> from object stylesheet and raw lines of css
    css(stylesheet, ...raw) {
        const result = [];
        for(const [sel, styles] of Object.entries(stylesheet)) {
            result.push(`${sel} {`);
            for(const [name, value] of Object.entries(styles)) {
                result.push(`  ${name}: ${value};`);
            }
            result.push('}', '');
        }
        if(raw.length) result.push(...raw);
        const css = result.join('\n').trim();
        log('generated css:', css);
        const element = dom('style', {}, [css]);
        document.head.appendChild(element);
        log('generated <style>:', element);
    },
    // create an element with props and children
    // children can be anything and are handled recursively:
    // if array:    handle each element of it
    // if DOM Node: append child to element
    // otherwise:   convert to string and make into Text Node
    dom(elname, props, ...children) {
        const el = document.createElement(elname);
        if(!props) props = {};
        Object.entries(props).forEach(([name, value]) => { el[name] = value; });
        const addChild = (child) => { // Recursively handle children
            if(!child) return;
            if(Array.isArray(child)) return child.forEach(x => addChild(x));
            if(typeof(child) === 'string') return addChild(document.createTextNode(child));
            if(typeof(child) === 'object') {
                if(child instanceof Node) return el.appendChild(child);
                return addChild(JSON.stringify(child));
            }
            addChild(String(child));
        }
        addChild(children);
        return el;
    },
    // Function for .sort(): descending order of prop
    desc(prop) {
        return (a, b) => b[prop] - a[prop];
    },
    // Function for .sort(): asscending order of prop
    asc(prop) {
        return (a, b) => a[prop] - b[prop];
    },
    // query single element with optional root
    $(a, b) {
        if(typeof(a) === 'string') { return document.querySelector(a); }
        return a.querySelector(b);
    },
    // query all elements with optional root
    $$(a, b) {
        if(typeof(a) === 'string') { return Array.from(document.querySelectorAll(a)); }
        return Array.from(a.querySelectorAll(b));
    },
    // console.log with prefix
    log(...args) {
        console.log('[OZON]', ...args);
    },
    // console.error with prefix
    error(...args) {
        console.error('[OZON]', ...args);
    }
}
