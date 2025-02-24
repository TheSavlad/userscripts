// ==UserScript==
// @name         Ozon Helper
// @namespace    https://www.ozon.ru
// @version      1.6
// @description  Set of tweaks to Ozon website
// @author       Savlad
// @match        https://www.ozon.ru/my/orderlist*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ozon.ru
// @grant        none
// @require      https://raw.githubusercontent.com/TheSavlad/userscripts/refs/heads/main/ozon/general.min.js#sha256=4a0f6d017e4cd91185f80cd1c2cd297d886aaa4babdd5384e007e267b108304f
// @require      https://raw.githubusercontent.com/TheSavlad/userscripts/refs/heads/main/ozon/orderlist.min.js#sha256=bb234d4b98bf785db663a7ecbbd38b109f02091ccd1306eb0562d7ecdf8e7cf1
// ==/UserScript==

(function () {
  "use strict";

  const ozon = /** @type {any} */ (window).ozon;
  delete (/** @type {any} */ (window).ozon);

  // select a handler based on pathname
  const m = /\/(?:(.*)\/|(.*))/.exec(location.pathname.toLowerCase());
  const path = m?.[1] || m?.[2];
  switch (path) {
    case "my/orderlist":
      return ozon.orderlist();
    default:
      return ozon.log("Unknown pathname:", location.pathname);
  }
})();
