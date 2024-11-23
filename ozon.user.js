// ==UserScript==
// @name         Ozon Helper
// @namespace    https://www.ozon.ru
// @version      0.3
// @description  Set of tweaks to Ozon website
// @author       SaVlad
// @match        https://www.ozon.ru/my/orderlist*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ozon.ru
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // create <style> from object stylesheet and raw lines of css
    function css(stylesheet, ...raw) {
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
    }
    // create an element with props and children
    // children can be anything and are handled recursively:
    // if array:    handle each element of it
    // if DOM Node: append child to element
    // otherwise:   convert to string and make into Text Node
    function dom(elname, props, ...children) {
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
    }
    // Function for .sort(): descending order of prop
    function desc(prop) {
        return (a, b) => b[prop] - a[prop];
    }
    // Function for .sort(): asscending order of prop
    function asc(prop) {
        return (a, b) => a[prop] - b[prop];
    }
    // query single element with optional root
    function $(a, b) {
        if(typeof(a) === 'string') { return document.querySelector(a); }
        return a.querySelector(b);
    }
    // query all elements with optional root
    function $$(a, b) {
        if(typeof(a) === 'string') { return Array.from(document.querySelectorAll(a)); }
        return Array.from(a.querySelectorAll(b));
    }
    // console.log with prefix
    function log(...args) {
        console.log('[OZON]', ...args);
    }
    // console.error with prefix
    function error(...args) {
        console.error('[OZON]', ...args);
    }

    // /my/orderlist handler
    function orderlist() {
        // constants
        const ORDER_STATE_CANCEL = 0;    // Отменён
        const ORDER_STATE_PREPARING = 1; // В сборке
        const ORDER_STATE_LOADING = 2;   // Передаётся в доставку
        const ORDER_STATE_DRIVING = 3;   // В пути
        const ORDER_STATE_READY = 4;     // Ожидает получения
        const ORDER_STATE_COMPLETE = 5;  // Получен
        const GROUP_STATE_CANCEL = 0;    // Все заказы в группе отменены
        const GROUP_STATE_COMPLETE = 1;  // Все заказы в группе завершены
        const GROUP_STATE_WORKING = 2;   // В группе есть заказы в работе
        const GROUP_STATE_READY = 3;     // Все заказы в группе ожидают получения

        // Full CSS
        css({
            'body #layoutPage>div>[data-widget=wallpaper]': {
                'margin-top': '179px'
            },
            '.ozon-helper-orders': {
                'left': '0px',
                'right': '0px',
                'background-color': '#FFFFFF',
                'border-bottom': '1px solid #E0E6EF',
                'display': 'flex',
                'overflow-x': 'scroll',
                'gap': '5px',
                'padding': '5px'
            },
            '.ozon-helper-orders.fixed': {
                'position': 'fixed',
                'top': '63px'
            },
            '.ozon-helper-orders.absolute': {
                'position': 'absolute',
                'top': '132px'
            },
            '.ozon-order': {
                'display': 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                'border': '1px solid #E0E6EF',
                'padding': '3px'
            },
            '.ozon-order-ready': {
                'animation': '1s infinite alternate ozon-blink',
                'background-color': 'currentcolor',
                'box-shadow': '0px 0px 10px currentcolor'
            },
            '.ozon-order-ready .ozon-item-state-name': {
                'border': 'none',
                'color': 'black'
            },
            '.ozon-order-items': {
                'display': 'flex',
                'gap': '3px'
            },
            '.ozon-item': {
                'display': 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                'gap': '3px'
            },
            '.ozon-item-state-name': {
                'border-bottom': '1px solid #E0E6EF',
                'padding-bottom': '3px'
            },
            '.ozon-order a': {
                'min-width': '100px',
                'max-width': '100px',
                'min-height': '100px',
                'max-height': '100px',
                'display': 'flex',
                'justify-content': 'center',
                'align-items': 'center'
            },
            '.ozon-order a>img': {
                'max-width': '100%',
                'max-height': '100%'
            },
            '.ozon-order-divider': {
                'min-width': '5px',
                'min-height': '100%',
                'background-color': '#E0E6EF'
            }
        },
            '@keyframes ozon-blink {',
            '    0% { background-color: hsl(45, 80%, 50%); box-shadow: 0px 0px 10px hsl(45, 80%, 40%); }',
            '   10% { background-color: hsl(45, 80%, 50%); box-shadow: 0px 0px 10px hsl(45, 80%, 40%); }',
            '   80% { background-color: hsl(45, 80%, 80%); box-shadow: 0px 0px  2px hsl(45, 80%, 40%); }',
            '  100% { background-color: hsl(45, 80%, 80%); box-shadow: 0px 0px  2px hsl(45, 80%, 40%); }',
            '}'
        );

        // Find native OZON header to stick to
        const stickyHeader = $('#stickyHeader');
        if(!stickyHeader) { return error('sticky header not found'); }
        log('stickyHeader =', stickyHeader);
        // Create own container for orders
        const ordersContainer = dom('div', { className: 'ozon-helper-orders' });
        ordersContainer.addEventListener('wheel', e => {
            // on mouse wheel event, scroll horizontally
            ordersContainer.scrollBy(e.deltaY, 0, { behavior: 'smooth' });
            e.preventDefault();
        });
        // Appended to body because OZON uses VUE and it hates when you mess with it's DOM
        document.body.appendChild(ordersContainer);
        log('container created:', ordersContainer);

        // Observe changes to header
        const headerObserver = new MutationObserver(onHeaderMutation);
        headerObserver.observe(stickyHeader, { attributes: true });
        log('observing header');
        doUpdateHeader();

        // Find paginator with OZON orders
        const paginator = $('[data-widget=paginator]>div');
        if(!paginator) { return error('paginator not found'); }
        log('paginator =', paginator);
        // Observe changes to paginator
        const paginatorObserver = new MutationObserver(onPaginatorMutation);
        paginatorObserver.observe(paginator, { childList: true });
        log('observing paginator');

        // Update orders out of order for initialization
        doUpdate();

        // Handle order bar update
        function doUpdate() {
            log('updating orders');
            const orders = [];
            // Process every "row" of orders
            for(const row of $$(paginator, '[data-widget=orderList] .w1e_14')) {
                const order = { day: null, month: null, date: null, items: [] };
                // Find and handle order state
                const stateElement = $(row, '.e5u_14');
                if(!stateElement) { error('state element not found for', row); continue; }
                const sm = /(?:(отменён)|(в сборке)|(передаётся)|(в пути)|(ожидает)|(получен))/i.exec(stateElement.innerText.toLowerCase());
                if(!sm) { error('unknown state in', stateElement); continue; }
                const orderState = sm.findIndex((x, i) => i>0 && !!x) - 1;
                // Date found in a different element when order is ready to pick up
                const dateClass = orderState === ORDER_STATE_READY ? '.u4e_14' : '.ew4_14';
                // Find and parse expected date
                const dateElement = $(row, dateClass);
                if(!dateElement) { error('date element not found for', row); continue; }
                const m = /(\d+) ([а-яё]+)/.exec(dateElement.innerText.trim());
                if(!m) { error('invalid date string in', dateElement); continue; }
                const [fullMatch, num, monStr] = m;
                order.date = fullMatch; // Store original string for later grouping
                order.day = +num;
                if(isNaN(order.day)) { error('invalid day in', dateElement); continue; }
                // Convert month name to month index
                const monMatch = /(?:(январ)|(феврал)|(март)|(апрел)|(ма)|(июн)|(июл)|(август)|(сентябр)|(октябр)|(ноябр)|(декабр))/i.exec(monStr.toLowerCase());
                if(!monMatch) { error('unknown month in', dateElement); continue; }
                order.month = monMatch.findIndex((x,i) => i>0 && !!x) - 1;
                // If order is ready to be picked up, change date to reflect it.
                // As an added bonus, this will separate ready items from otherwise in same order
                if(orderState === ORDER_STATE_READY) {
                    order.date = `до ${order.date}`;
                }
                // Handle individual items in the order
                for(const child of $$(row, '.w5e_14')) {
                    const item = { href: null, src: null, state: orderState, stateName: '' };
                    item.stateName = ['🛑 Отменён', '⌛ В сборке', ' 📦Передаётся', '🚚 В пути', '⚠️ Ожидает', '✅ Получен'][orderState];
                    item.href = child.href;
                    if(!item.href) { error('no href for', child); continue; }
                    const img = $(child, 'img');
                    if(!img) { error('no img for', child); continue; }
                    item.src = img.src;
                    if(!item.href) { error('no src for', img); continue; }
                    order.items.push(item);
                }
                orders.push(order);
                log('order:', order);
            }
            // Done parsing orders
            log(orders.length, 'orders found');
            const groups = {}; // Here we will store orders grouped by date
            for(const order of orders) {
                // Create group if not found
                if(!groups[order.date]) {
                    groups[order.date] = {
                        day: order.day,
                        mon: order.month,
                        str: order.date,
                        state: -1,
                        index: +[ // Required for later sorting by date
                            1,
                            String(order.month).padStart(2, '0'),
                            String(order.day).padStart(2, '0')
                        ].join(''),
                        orders: []
                    };
                }
                // Add order items into group items
                groups[order.date].orders.push(...order.items);
            }
            // Figure out group state based on items' state
            for(const group of Object.values(groups)) {
                // If any item is ready: READY
                // If all items are completed: COMPLETE
                // If all items are cancelled: CANCEL
                // Default: WORKING
                group.state = GROUP_STATE_WORKING;
                if(group.orders.some(x => x.state === ORDER_STATE_READY)) group.state = GROUP_STATE_READY;
                else if(group.orders.every(x => x.state === ORDER_STATE_COMPLETE)) group.state = GROUP_STATE_COMPLETE;
                else if(group.orders.every(x => x.state === ORDER_STATE_CANCEL)) group.state = GROUP_STATE_CANCEL;
            }
            // Sort groups by state
            const sortedGroups = Object.values(groups).sort(desc('state'));
            log('sorted groups:', sortedGroups);
            const readyGroups = [];
            const transitGroups = [];
            const completeGroups = [];
            // Separate groups into arrays based on group state
            for(const group of sortedGroups) {
                if(group.state === GROUP_STATE_CANCEL) continue;
                // Group states start from 1, so put falsy into index 0
                const category = [0, completeGroups, transitGroups, readyGroups][group.state];
                if(!category) { error('unknown group category for:', group); continue; }
                category.push(group);
            }
            // Remove all children from orders container
            while(ordersContainer.firstChild) ordersContainer.firstChild.remove();
            // Print groups in order:
            // READY groups: earlier->later
            // WORKING groups: earlier->later
            // COMPLETE groups: later->earlier
            // CANCEL groups: skip
            // Put dividers between each group (if necessary)
            readyGroups.sort(asc('index')).forEach(x => addOrderGroup(x));
            if(readyGroups.length > 0 && (transitGroups.length > 0 || completeGroups.length > 0)) addOrderGroupDivider();
            transitGroups.sort(asc('index')).forEach(x => addOrderGroup(x));
            if(completeGroups.length > 0 && (transitGroups.length > 0 || readyGroups.length > 0)) addOrderGroupDivider();
            completeGroups.sort(desc('index')).forEach(x => addOrderGroup(x));
        }
        // Add group of orders to the order container
        function addOrderGroup(group) {
            const classes = ['ozon-order']; // READY groups get special blinking animation
            if(group.state === GROUP_STATE_READY) classes.push('ozon-order-ready');
            const el = dom(
                'div', { className: classes.join(' ') },
                dom(
                    'div', { className: 'ozon-order-items' },   // Items container
                    group.orders.map(x => dom(
                        'div', { className: 'ozon-item' },      // Individual item card
                        dom('a', { href: x.href }, dom('img', { // Item image
                            loading: 'lazy',
                            fetchPriority: 'low',
                            src: x.src
                        })),
                        dom(                                    // Item state
                            'div', { className: `ozon-item-state ozon-item-state-${x.state}` },
                            dom('div', { className: 'ozon-item-state-name' }, x.stateName)
                        )
                    ))
                ),
                dom('div', { className: 'ozon-order-date' }, group.str) // Order date
            );
            ordersContainer.appendChild(el);
        }
        // Add group divider to the order container
        function addOrderGroupDivider() {
            ordersContainer.appendChild(dom('div', { className: 'ozon-order-divider' }));
        }
        // Update order container style based on OZON header state
        function doUpdateHeader() {
            log('updating header');
            // if true, we scrolled down and OZON header have stuck to the top of the screen
            const isSticky = stickyHeader.classList.contains('d4i_9');
            log('header is sticky =', isSticky);
            ordersContainer.classList.toggle('fixed', isSticky);
            ordersContainer.classList.toggle('absolute', !isSticky);
        }
        // We have observed paginator mutation; Update order container
        function onPaginatorMutation() {
            log('paginator mutation observed');
            doUpdate();
        }
        // We have observed OZON header mutation; Update order container style
        function onHeaderMutation() {
            log('stickyHeader mutation observed');
            doUpdateHeader();
        }
    }

    // select a handler based on pathname
    switch(location.pathname.toLowerCase()) {
        case '/my/orderlist': return orderlist();
        default: return log('Unknown pathname:', location.pathname);
    }
})();
