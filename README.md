# OZON
Set of tweaks for Ozon website  
Only one tweak so far though...

Uses @require feature to load additional parts of the script:
* [general](ozon/general.part.js) - set of utility functions used in other modules
* [orderlist](ozon/orderlist.part.js) - main handler of order list page

Those additional modules are minified and verified by hashes.  
Main file [ozon.user.js](ozon.user.js) only has minimal code.

### Features:
* Add a horizontal list of orders parsed from the native ozon order list.
* As you scroll down and page loads more orders, bar is updated.
* Orders are grouped by date of delivery, expected date of delivery, or date until item is due.
* Each item shows thumbnail and current status.
* Cancelled items are filtered out.
* Intelligent injection: should keep working even when devs mess up classnames.
