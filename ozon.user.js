// ==UserScript==
// @name         Ozon Helper
// @namespace    https://www.ozon.ru
// @version      1.0
// @description  Set of tweaks to Ozon website
// @author       Savlad
// @match        https://www.ozon.ru/my/orderlist*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ozon.ru
// @grant        none
// @require      https://raw.githubusercontent.com/TheSavlad/userscripts/refs/heads/main/ozon/general.min.js
// @require      https://raw.githubusercontent.com/TheSavlad/userscripts/refs/heads/main/ozon/orderlist.min.js
// ==/UserScript==

(function () {
  "use strict";

  // select a handler based on pathname
  switch (location.pathname.toLowerCase()) {
    case "/my/orderlist":
      return window.ozon.orderlist();
    default:
      return window.ozon.log("Unknown pathname:", location.pathname);
  }
})();
