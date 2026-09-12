# Nano Motion

A static sportswear storefront using HTML, CSS, and vanilla JavaScript. No build, database, API, or backend application is required. Publish the contents of `dist/` on any static web host. A local HTTP server is recommended for testing registration (Web Crypto requires localhost or HTTPS).

## Features

- 18 mocked products across six categories; locally bundled representative photographs.
- Home, search/category listing, filters, sorting, product details, shopping bag, direct checkout, checkout confirmation, and membership views.
- Size selection, quantities, persistent cart, and separate Buy now checkout that preserves the cart.
- Demo registration and login; salted SHA-256 demo password hashes are stored locally. This is a UI simulation, not secure authentication or authorization.
- US shipping form with fictional demo autofill and simulated payment. No payment details, emails, or orders are transmitted.
- Responsive layout, keyboard controls, form validation, and empty states.

## Demo member

Registration requires first name, last name, username, email, and password. Street address, city, US state, ZIP code, and country are optional and can be saved independently. A supplied ZIP must use 5 digits or ZIP+4. Saved address fields appear in the member profile, persist across login, and prefill checkout; checkout still requires complete shipping details.

| Field | Value |
| --- | --- |
| Username | alexmorgan |
| Password | Motion2026! |
| Name | Alex Morgan |
| Email | alex.morgan@example.com |
| Phone | +1 202-555-0147 |
| Address | 123 Example Avenue, Portland, OR 97205, United States |

All identity and address information is fictional. The Account page also has an “Explore as Alex Morgan” button.

## URL parameters

Views use query routes, so refreshing/deep linking works on simple static hosts without server rewrites:

```text
?page=shop&category=Running+gear
?page=shop&q=tee&sort=low&size=M
?page=product&id=stride-runner
?page=account&mode=register
?page=home&utm_source=demo&campaign=launch
```

All incoming query parameters, including repeated keys, are captured on initial load, navigation, and browser back/forward:

```js
window.NanoMotion.urlParams; // { page: ['home'], utm_source: ['demo'], ... }
window.NanoMotion.getParam('utm_source'); // 'demo' or null
window.NanoMotion.getAllParams('tag'); // every value for repeated tag keys
JSON.parse(sessionStorage.getItem('nm_url_params'));
window.addEventListener('nanomotion:urlchange', e => console.log(e.detail));
```

Parameter values are treated as text, not HTML or executable code. Capture reflects the current URL; arbitrary campaign parameters are not carried into other internal links.

## Tracking pixel

The shared `dist/index.html` head loads `https://bzrcdn.openai.com/sdk/oaiq.min.js` asynchronously and initializes pixel `G8S7mZVdqGge6VYTmwqBfz` with `debug: true`. All query-based views share this document, so the SDK remains loaded during internal navigation. The supplied initialization snippet is shared by the page-view and member-identification integrations below. Actual event delivery depends on the SDK, its configuration, and browser/network availability.

### Page-view events

`dist/pixel-events.js` sends `oaiq('measure', 'page_viewed', { type: 'contents', contents: [{ id, name, content_type: 'page' }] })` on initial entry and navigation to the home or product-list views, including browser back/forward and list filter changes. It does not fire on UI-only rerenders or other views.

Content IDs are `home`, `product-list`, `search-results`, or `category-<category-slug>` (for example, `category-running-gear`). Search terms are not copied into the event payload. Reloading or revisiting an eligible page counts as a new view. Calls use the existing SDK queue if the external script is still loading.

### Product-view events

Opening a valid product detail page sends `contents_viewed` with `type: 'contents'` and its catalog ID/name plus `content_type: 'product'`. This covers product clicks, direct links, reloads, and browser history navigation. Size/quantity interactions and adding to the bag do not emit another product view. Missing/invalid product IDs are ignored. Like page views, product views wait for member identification before being queued.

### Registration events

New account creation sends `oaiq('measure', 'registration_completed', { type: 'customer_action' })` after account storage succeeds and member identification completes. Normal login, the demo shortcut, page refreshes, duplicate accounts, failed storage, and repeated submission do not emit this event.

### Subscription events

`subscription_created` fires only after a new Premium subscription is successfully saved, and waits for member identification. Its payload is `{ type: 'plan_enrollment', plan_id, amount, currency: 'USD' }`: monthly uses `premium_monthly` and `1500`; yearly uses `premium_yearly` and `12000`. Amounts are USD cents. Existing subscriptions, repeat clicks, failed saves, login, and page refreshes do not emit another subscription event. These represent demo enrollments, not real charges.

### Shopping events

- `items_added`: successful Add to bag and cart quantity increases. Quantity is the actual increment (respecting the 99-item cap). Top-level amount is the added merchandise total; each content amount is its unit price. Decreases, removals, and rejected additions emit nothing.
- `checkout_started`: entry to a valid populated checkout, through Buy now, the cart, a direct link, or browser history. Ordinary rerenders emit nothing. A fresh checkout visit/reload counts as a new start.
- `order_created`: successful demo order submission only, with a guard against duplicate submissions. Refreshing or revisiting confirmation does not emit it again.

All three use `type: 'contents'`, `currency: 'USD'`, product IDs/names, `content_type: 'product'`, and quantities. **Amounts are integer US cents** ($25.99 → 2599). Checkout/order amounts match the displayed total including shipping and demo tax. Checkout/order contents omit line amount and currency, matching the supplied schema. Payloads are captured before awaiting member identification, so subsequent cart edits cannot change them. Orders remain simulated; these events do not represent real payments.

### Logged-in pixel identification

`dist/pixel-user.js` sends `oaiq('init', { user: ... })` after successful login (including the demo shortcut), registration, and restored sessions. It refreshes changed profile fields, deduplicates unchanged navigation, and clears the SDK user on logout. Revision checks prevent pending hashes from identifying a logged-out or switched account.

`render()` calls `syncPixelUser(currentUser)` directly on initial landing and navigation; both login handlers also invoke it explicitly. Concurrent calls share the pending hashing promise. Page views wait for identification to finish, so a restored logged-in session queues its hashed `init` before `measure`. Guests have no identity payload. Stale or failed identification does not emit a member page view.

Email is trimmed/lowercased; phone formatting and leading zeroes are removed and only 8–15 digits are accepted; names are lowercased with whitespace and ASCII punctuation removed, preserving non-ASCII characters. SHA-256 outputs are lowercase hexadecimal. Empty or invalid optional fields are omitted. Geography is sent unhashed: US country code, city/region limited to 128 characters, and postal code limited to 32 with letters, digits, spaces, and hyphens only.

The external identifier is a stable pseudonymous customer ID, not an email or name. Registered members receive a random UUID retained per username in `nm_customer_ids`; the built-in demo member has a fixed mock customer ID. IDs remain stable on this browser until site data is cleared. No raw email, phone, name, street address, password, or account object is passed by this integration. If hashing/storage fails, identification is skipped without a raw-data fallback.

## Browser storage

`localStorage`: `nm_cart`, `nm_accounts`, `nm_session`, `nm_last_order`.
`sessionStorage`: `nm_url_params`.

### Premium subscriptions

The membership portal offers Basic (free) and Premium: **$15 USD/month** or **$120 USD/year**. The yearly plan saves $60 versus 12 monthly periods. These are simulated subscriptions with no actual charges or automatic billing.

`localStorage.nm_memberships` stores each member's tier, active status, plan, price, currency, and subscription timestamp, keyed by normalized username. This includes the built-in Alex demo member. Membership survives refresh, logout, and either login method on the same browser. Separate accounts have separate membership records. Existing members without a record default to Basic. The subscription remains active until this local demo data is cleared; there is no backend renewal scheduler.

Cookies are unnecessary for this initial static version. Demo login persists on the current browser until logout. Storage is not shared between devices. Use fictional details and never reuse a real password. Clear the listed keys or site storage to reset the demo. Browser storage and source code can be changed by visitors; a production store would need server-backed authentication, pricing, inventory, order processing, and payments.

## Files

- `dist/index.html` — document and application entry point
- `dist/data.js` — mocked products, categories, and demo member
- `dist/app.js` — routes, URL capture, shopping, checkout, membership
- `dist/styles.css` — visual design and responsive layout
- `dist/assets/` — bundled images and favicon
- `IMAGE_SOURCES.md` — image attribution and source links

Fonts load from Google Fonts with local system fallbacks. Product photographs are representative demo references, and may be reused across mocked variants.
