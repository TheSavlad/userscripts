// tsc --allowJs --checkJs --noEmit --strict --lib dom,es2017
// @ts-check
(() => {
  const orderlist = (function () {
    /**
     * @typedef {Record<string, Record<string, string>>} OzonCssParameter
     */
    /**
     * @typedef {{
     *   (selector: string): HTMLElement | undefined;
     *   (root: HTMLElement, selector: string): HTMLElement | undefined;
     * }} OzonSelectorFunction
     */
    /**
     * @typedef {{
     *   (selector: string): HTMLElement[];
     *   (root: HTMLElement, selector: string): HTMLElement[];
     * }} OzonSelectorManyFunction
     */
    /**
     * @typedef OzonGeneral
     * @prop {(sheet: OzonCssParameter, ...raw: string[]) => void} css
     * @prop {(name: string, props: Record<string, any>, ...children: any[]) => HTMLElement} dom
     * @prop {(prop: any) => (a: any, b: any) => number} desc
     * @prop {(prop: any) => (a: any, b: any) => number} asc
     * @prop {OzonSelectorFunction} $
     * @prop {OzonSelectorManyFunction} $$
     * @prop {(...args: any[]) => void} log
     * @prop {(...args: any[]) => void} error
     * @prop {(hay: string, needles: string[]) => number} findMany
     * @prop {(target: HTMLElement, config: MutationObserverInit, callback: MutationCallback) => MutationObserver} observe
     */
    /**
     * @typedef OzonOrderItem
     * @prop {string} href
     * @prop {string} src
     * @prop {number} state
     * @prop {string} stateName
     */
    /**
     * @typedef OzonOrder
     * @prop {number} day
     * @prop {number} month
     * @prop {string} date
     * @prop {number} state
     * @prop {OzonOrderItem[]} items
     */
    /**
     * @typedef OzonOrderGroup
     * @prop {number} day
     * @prop {number} mon
     * @prop {string} str
     * @prop {number} state
     * @prop {number} index
     * @prop {OzonOrderItem[]} orders
     */

    /** @type OzonGeneral */
    const ozon = /** @type {any} */ (window).ozon;
    const { $, $$, error, log, dom } = ozon;

    // constants
    const ORDER_STATE_CANCEL = 0; //    Отменён
    const ORDER_STATE_PREPARING = 1; // В сборке
    const ORDER_STATE_LOADING = 2; //   Передаётся в доставку
    const ORDER_STATE_DRIVING = 3; //   В пути
    const ORDER_STATE_READY = 4; //     Ожидает получения
    const ORDER_STATE_COMPLETE = 5; //  Получен
    const GROUP_STATE_CANCEL = 0; //    Все заказы в группе отменены
    const GROUP_STATE_COMPLETE = 1; //  Все заказы в группе завершены
    const GROUP_STATE_WORKING = 2; //   В группе есть заказы в работе
    const GROUP_STATE_READY = 3; //     Все заказы в группе ожидают получения

    const stateNeedles =
      "отменён,в сборке,передаётся,в пути,ожидает,получен".split(",");
    const monthNeedles =
      "январ,феврал,март,апрел,ма,июн,июл,август,сентябр,октябр,ноябр,декабр".split(
        ","
      );
    /** @type {Record<number, string>} */
    const stateNames = {
      [ORDER_STATE_CANCEL]: "🛑 Отменён",
      [ORDER_STATE_PREPARING]: "⌛ В сборке",
      [ORDER_STATE_LOADING]: "📦 Передаётся",
      [ORDER_STATE_DRIVING]: "🚚 В пути",
      [ORDER_STATE_READY]: "⚠️ Ожидает",
      [ORDER_STATE_COMPLETE]: "✅ Получен",
    };

    /** @type {[OzonCssParameter, ...string[]]} */
    const css = [
      {
        "body #layoutPage>div>[data-widget=wallpaper]": {
          "margin-top": "179px",
        },
        ".ozon-helper-orders": {
          left: "0px",
          right: "0px",
          "background-color": "#FFFFFF",
          "border-bottom": "1px solid #E0E6EF",
          display: "flex",
          "overflow-x": "scroll",
          gap: "5px",
          padding: "5px",
        },
        ".ozon-helper-orders.fixed": {
          position: "fixed",
          top: "63px",
        },
        ".ozon-helper-orders.absolute": {
          position: "absolute",
          top: "132px",
        },
        ".ozon-order": {
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          border: "1px solid #E0E6EF",
          padding: "3px",
        },
        ".ozon-order-ready": {
          animation: "1s infinite alternate ozon-blink",
          "background-color": "currentcolor",
          "box-shadow": "0px 0px 10px currentcolor",
        },
        ".ozon-order-ready .ozon-item-state-name": {
          border: "none",
          color: "black",
        },
        ".ozon-order-items": {
          display: "flex",
          gap: "3px",
        },
        ".ozon-item": {
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          gap: "3px",
        },
        ".ozon-item-state-name": {
          "border-bottom": "1px solid #E0E6EF",
          "padding-bottom": "3px",
        },
        ".ozon-order a": {
          "min-width": "100px",
          "max-width": "100px",
          "min-height": "100px",
          "max-height": "100px",
          display: "flex",
          "justify-content": "center",
          "align-items": "center",
        },
        ".ozon-order a>img": {
          "max-width": "100%",
          "max-height": "100%",
        },
        ".ozon-order-divider": {
          "min-width": "5px",
          "min-height": "100%",
          "background-color": "#E0E6EF",
        },
      },
      "@keyframes ozon-blink {",
      "    0% { background-color: hsl(45, 80%, 50%); box-shadow: 0px 0px 10px hsl(45, 80%, 40%); }",
      "   10% { background-color: hsl(45, 80%, 50%); box-shadow: 0px 0px 10px hsl(45, 80%, 40%); }",
      "   80% { background-color: hsl(45, 80%, 80%); box-shadow: 0px 0px  2px hsl(45, 80%, 40%); }",
      "  100% { background-color: hsl(45, 80%, 80%); box-shadow: 0px 0px  2px hsl(45, 80%, 40%); }",
      "}",
    ];

    /**
     * @param {HTMLElement} row
     * @param {OzonOrder} order
     * @returns {void | true}
     */
    function parseOrderState(row, order) {
      const stateElement = $(row, ".e5u_14");
      if (!stateElement) return error("state element not found for", row);

      const stateText = stateElement.innerText.toLowerCase();
      const orderState = ozon.findMany(stateText, stateNeedles);
      if (orderState < 0) return error("unknown state in", stateElement);

      order.state = orderState;
      return true;
    }
    /**
     * @param {HTMLElement} row
     * @param {OzonOrder} order
     * @returns {void | true}
     */
    function parseOrderDate(row, order) {
      // Date found in a different element when order is ready to pick up
      const dateClass =
        order.state === ORDER_STATE_READY ? ".u4e_14" : ".ew4_14";

      const dateElement = $(row, dateClass);
      if (!dateElement) return error("date element not found for", row);

      const dateMatch = /(\d+) ([а-яё]+)/.exec(dateElement.innerText.trim());
      if (!dateMatch) return error("invalid date string in", dateElement);

      const [fullMatch, numStr, monStr] = dateMatch;
      order.date = fullMatch; // Store original string for later grouping
      order.day = +numStr;

      if (isNaN(order.day)) return error("invalid day in", dateElement);

      // Convert month name to month index
      order.month = ozon.findMany(monStr.toLowerCase(), monthNeedles);
      if (order.month < 0) return error("unknown month in", dateElement);

      // If order is ready to be picked up, change date to reflect it.
      // As an added bonus, this will separate ready items from otherwise in same order
      if (order.state === ORDER_STATE_READY) {
        order.date = `до ${order.date}`;
      }

      return true;
    }
    /**
     * @param {HTMLElement} child
     * @param {OzonOrder} order
     * @returns {OzonOrderItem | void}
     */
    function parseOrderItem(child, order) {
      if (child.tagName !== "A") return error("element not <a>:", child);
      const el = /** @type {HTMLAnchorElement} */ (child);

      /** @type {OzonOrderItem} */
      const item = { href: "", src: "", state: order.state, stateName: "" };
      item.stateName = stateNames[order.state];

      item.href = el.href;
      if (!item.href) return error("no href for", el);

      const img = /** @type {HTMLImageElement | undefined} */ ($(el, "img"));
      if (!img) return error("no img for", el);

      item.src = img.src;
      if (!item.src) return error("no src for", img);

      return item;
    }
    /**
     * @param {HTMLElement} row
     * @returns {OzonOrder | void}
     */
    function parseOrder(row) {
      /** @type {OzonOrder} */
      const order = { day: -1, month: -1, date: "", state: -1, items: [] };
      if (!parseOrderState(row, order)) return;
      if (!parseOrderDate(row, order)) return;

      // Handle individual items in the order
      for (const child of $$(row, ".w5e_14")) {
        const item = parseOrderItem(child, order);
        if (!item) continue;
        order.items.push(item);
      }

      log("order:", order);
      return order;
    }
    /**
     * @param {HTMLElement} paginator
     * @returns {OzonOrder[]}
     */
    function parseOrders(paginator) {
      const orders = [];
      // Process every "row" of orders
      for (const row of $$(paginator, "[data-widget=orderList] .w1e_14")) {
        const order = parseOrder(row);
        if (!order) continue;
        orders.push(order);
      }
      return orders;
    }

    /**
     * @param {OzonOrder[]} orders
     * @returns {OzonOrderGroup[]}
     */
    function groupOrders(orders) {
      /** @type {Record<string, OzonOrderGroup>} */
      const groups = {};
      for (const order of orders) {
        // Create group if not found
        if (!groups[order.date]) {
          groups[order.date] = {
            day: order.day,
            mon: order.month,
            str: order.date,
            state: -1,
            index: +[
              // Required for later sorting by date
              1,
              String(order.month).padStart(2, "0"),
              String(order.day).padStart(2, "0"),
            ].join(""),
            orders: [],
          };
        }
        // Add order items into group items
        groups[order.date].orders.push(...order.items);
      }

      // Figure out group state based on items' state
      for (const group of Object.values(groups)) {
        // If any item is ready: READY
        // If all items are completed: COMPLETE
        // If all items are cancelled: CANCEL
        // Default: WORKING
        group.state = GROUP_STATE_WORKING;
        if (group.orders.some((x) => x.state === ORDER_STATE_READY))
          group.state = GROUP_STATE_READY;
        else if (group.orders.every((x) => x.state === ORDER_STATE_COMPLETE))
          group.state = GROUP_STATE_COMPLETE;
        else if (group.orders.every((x) => x.state === ORDER_STATE_CANCEL))
          group.state = GROUP_STATE_CANCEL;
      }

      // Sort groups by state
      return Object.values(groups).sort(ozon.desc("state"));
    }

    /**
     * @param {OzonOrderGroup[]} groups
     * @returns {[OzonOrderGroup[],OzonOrderGroup[],OzonOrderGroup[]]}
     */
    function categorizeGroups(groups) {
      /** @type {OzonOrderGroup[]} */
      const ready = [];
      /** @type {OzonOrderGroup[]} */
      const working = [];
      /** @type {OzonOrderGroup[]} */
      const complete = [];

      // Separate groups into arrays based on group state
      for (const group of groups) {
        // Entirely ignore cancelled orders
        if (group.state === GROUP_STATE_CANCEL) continue;

        const category = {
          [GROUP_STATE_COMPLETE]: complete,
          [GROUP_STATE_WORKING]: working,
          [GROUP_STATE_READY]: ready,
        }[group.state];
        if (!category) {
          error("unknown group category for:", group);
          continue;
        }

        category.push(group);
      }

      return [complete, working, ready];
    }

    /** @param {HTMLElement} target */
    function addOrderGroupDivider(target) {
      target.appendChild(dom("div", { className: "ozon-order-divider" }));
    }

    /**
     * @param {OzonOrderGroup} group
     * @param {HTMLElement} target
     */
    function showOrderGroup(group, target) {
      const classes = ["ozon-order"]; // READY groups get special blinking animation
      if (group.state === GROUP_STATE_READY) classes.push("ozon-order-ready");
      // Equivalent:
      // <div className={classes.join(" ")}>
      //   <div className="ozon-order-items">
      //     {group.orders.map(x => (
      //       <div className="ozon-item">
      //         <a href={x.href}>
      //           <img loading="lazy" fetchpriority="low" src={x.src} />
      //         </a>
      //         <div className="ozon-item-state">
      //           <div className="ozon-item-state-name">{x.sstateName}</div>
      //         </div>
      //       </div>
      //     ))}
      //   </div>
      //   <div className="ozon-order-date">{group.str}</div>
      // </div>
      const el = dom(
        "div",
        { className: classes.join(" ") },
        dom(
          "div",
          { className: "ozon-order-items" },
          group.orders.map((x) =>
            dom(
              "div",
              { className: "ozon-item" },
              dom(
                "a",
                { href: x.href },
                dom("img", {
                  loading: "lazy",
                  fetchPriority: "low",
                  src: x.src,
                })
              ),
              dom(
                "div",
                { className: "ozon-item-state" },
                dom("div", { className: "ozon-item-state-name" }, x.stateName)
              )
            )
          )
        ),
        dom("div", { className: "ozon-order-date" }, group.str)
      );
      target.appendChild(el);
    }
    /**
     * @param {HTMLElement} target
     * @param {OzonOrderGroup[]} category
     * @param {(prop: string) => (a: any, b: any) => number} sorting
     */
    function showCategory(target, category, sorting) {
      category.sort(sorting("index")).forEach((x) => showOrderGroup(x, target));
    }

    /**
     * @param {HTMLElement} paginator
     * @param {HTMLElement} container
     */
    function onPaginator(paginator, container) {
      log("updating orders");

      const orders = parseOrders(paginator);
      log(orders.length, "orders found");

      const groups = groupOrders(orders);
      log("groups:", groups);

      const [complete, working, ready] = categorizeGroups(groups);

      // Remove all children from orders container
      while (container.firstChild) container.firstChild.remove();

      const len1 = ready.length;
      const len2 = working.length;
      const len3 = complete.length;
      const len12 = len1 + len2;
      const len23 = len2 + len3;

      // Print groups in order:
      // READY groups: earlier->later
      // WORKING groups: earlier->later
      // COMPLETE groups: later->earlier
      // CANCEL groups: skip
      // Put dividers between each group (if necessary)
      showCategory(container, ready, ozon.asc);
      if (len1 > 0 && len23 > 0) addOrderGroupDivider(container);
      showCategory(container, working, ozon.asc);
      if (len12 > 0 && len3 > 0) addOrderGroupDivider(container);
      showCategory(container, complete, ozon.desc);
    }

    /**
     * @param {HTMLElement} header
     * @param {HTMLElement} container
     */
    function onHeader(header, container) {
      log("updating header");
      // if true, we scrolled down and OZON header have stuck to the top of the screen
      const isSticky = header.classList.contains("d4i_9");
      log("header is sticky =", isSticky);
      container.classList.toggle("fixed", isSticky);
      container.classList.toggle("absolute", !isSticky);
    }

    return function () {
      ozon.css(...css);

      // Find native OZON header to stick to
      const header = $("#stickyHeader");
      if (!header) return error("sticky header not found");
      log("stickyHeader =", header);

      // Find paginator with OZON orders
      const list = $("[data-widget=paginator]>div");
      if (!list) return error("paginator not found");
      log("paginator =", list);

      // Create own container for orders
      const orders = dom("div", { className: "ozon-helper-orders" });
      orders.addEventListener("wheel", (e) => {
        // on mouse wheel event, scroll horizontally
        orders.scrollBy({ left: e.deltaY, behavior: "smooth" });
        e.preventDefault();
      });
      // Appended to body because OZON uses VUE and it hates when you mess with it's DOM
      document.body.appendChild(orders);
      log("container created:", orders);

      // Observe changes to header
      ozon.observe(header, { attributes: true }, () =>
        onHeader(header, orders)
      );
      log("observing header");
      onHeader(header, orders);

      // Observe changes to paginator
      ozon.observe(list, { childList: true }, () => onPaginator(list, orders));
      log("observing paginator");
      onPaginator(list, orders);
    };
  })();
  /** @type {any} */ (window).ozon.orderlist = orderlist;
})();
