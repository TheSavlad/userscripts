// ==UserScript==
// @name         Pogoda Refresh
// @namespace    https://yandex.ru/pogoda/ru/maps/nowcast
// @version      1.0
// @description  Add a button that refreshes the page every ten minutes
// @author       Savlad
// @match        https://yandex.ru/pogoda/ru/maps/nowcast*
// @icon         https://yandex.ru/weather/favicon.ico
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    function sleep(ms) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), ms);
        });
    }

    function waitMutation(el, options, callback, timeout) {
        return new Promise((resolve, reject) => {
            let timer = 0;
            function onMutation() {
                const t = callback();
                if(t === true) return;
                observer.disconnect();
                resolve();
                if(timer) clearTimeout(timer);
                timer = 0;
            }
            const observer = new MutationObserver(onMutation);
            observer.observe(el, options);
            if(timeout) {
                timer = setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Mutation timeout`));
                }, timeout);
            }
        });
    }

    function waitSelector(el, sel, timeout) {
        return new Promise(resolve => {
            const immediate = el.querySelector(sel);
            if(immediate) return resolve(immediate);
            waitMutation(el, { childList: true, subtree: true }, () => {
                const selected = el.querySelector(sel);
                if(selected) resolve(selected);
                else return true;
            }, timeout).catch(() => {
                resolve(null);
            });
        });
    }

    function createElement(name, props, ...children) {
        const el = document.createElement(name ?? 'div');
        for(const [n,v] of Object.entries(props ?? {})) {
            if(n.startsWith('@')) {
                el.setAttribute(n.substring(1), v);
            } else if(n === 'style') {
                for(const [sn, sv] of Object.entries(v)) {
                    el.style[sn] = sv;
                }
            } else if(typeof(v) === 'function') {
                el.addEventListener(n, v);
            } else {
                el[n] = v;
            }
        }
        for(const c of (children ?? [])) {
            if(typeof(c) !== 'object') el.appendChild(document.createTextNode(String(c)));
            else el.appendChild(c);
        }
        return el;
    }

    function formatTime(h,m,s) {
        if(h instanceof Date) return formatTime(h.getHours(), h.getMinutes(), h.getSeconds());
        const p = [m,s];
        if(h !== null) p.unshift(h);
        return p.map(x => String(x).padStart(2, '0')).join(':')
    }

    function setNextTimeout() {
        const next = new Date();
        next.setMinutes(Math.floor(next.getMinutes()/10+1)*10);
        next.setSeconds(0);
        const ms = next.getTime() - new Date().getTime();
        const ts = Math.floor(ms/1000)%60;
        const tm = Math.floor(ms/60000);
        console.log(`[Refresh] scheduled reload at ${formatTime(next)} (in ${formatTime(null, tm, ts)})`);
        return setTimeout(() => {
            location.reload();
        }, ms);
    }

    await sleep(1000);
    let t = 0;
    const menubar = await waitSelector(document, '[data-overlay-container] nav ul');
    const checkbox = createElement(
        'input',
        {
            type: 'checkbox',
            id: '__refresh',
            style: { cursor: 'pointer' },
            change: () => {
                if(t) clearTimeout(t);
                if(checkbox.checked) t = setNextTimeout();
                localStorage.setItem('__refresh', checkbox.checked);
            }
        }
    );
    if(localStorage.getItem('__refresh') === 'true') {
        t = setNextTimeout();
        checkbox.checked = true;
    }
    menubar.appendChild(
        createElement(
            'li',
            { style: { marginLeft: 'auto' } },
            createElement(
                'label',
                {
                    className: menubar.firstElementChild.firstElementChild.className,
                    '@aria-current': false,
                    '@role': 'menuitem',
                    '@for': '__refresh',
                    style: {
                        userSelect: 'none',
                        display: 'flex',
                        gap: '5px',
                        cursor: 'pointer'
                    }
                },
                checkbox,
                'Обновление'
            )
        )
    );
})();
