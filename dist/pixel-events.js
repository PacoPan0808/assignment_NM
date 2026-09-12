// Page-view and product-detail tracking share the initialized pixel queue.
function trackPixelPageView(params) {
  if (typeof window.oaiq !== 'function') return;
  const page = params.get('page') || 'home';
  let content;
  if (page === 'home') {
    content = { id: 'home', name: 'Nano Motion home page', content_type: 'page' };
  } else if (page === 'shop') {
    const category = params.get('category');
    if ((params.get('q') || '').trim()) {
      content = { id: 'search-results', name: 'Product search results', content_type: 'page' };
    } else if (CATEGORIES.includes(category)) {
      content = {
        id: `category-${category.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${category} product list`, content_type: 'page'
      };
    } else {
      content = { id: 'product-list', name: 'All products', content_type: 'page' };
    }
  }
  if (!content) return;
  try {
    window.oaiq('measure', 'page_viewed', { type: 'contents', contents: [content] });
    console.log("Page_view: "+ JSON.stringify(content))
  } catch {
    console.warn('Nano Motion: page-view tracking unavailable.');
  }
}

function trackPixelProductView(params) {
  if (params.get('page') !== 'product' || typeof window.oaiq !== 'function') return;
  const product = PRODUCTS.find(item => item.id === params.get('id'));
  if (!product) return;
  try {
    contents = [{ id: product.id, name: product.name, content_type: 'product' }];
    window.oaiq('measure', 'contents_viewed', {
      type: 'contents',
      contents: contents
    });
    console.log("Content_view: "+ JSON.stringify(contents))
  } catch {
    console.warn('Nano Motion: product-view tracking unavailable.');
  }
}

function pixelCommercePayload(eventName, items, orderTotal) {
  if (!['items_added', 'checkout_started', 'order_created'].includes(eventName)
    || !Array.isArray(items) || !items.length) return null;
  const contents = [];
  let subtotal = 0;
  for (const item of items) {
    const product = PRODUCTS.find(product => product.id === item.id);
    if (!product || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) return null;
    const unitAmount = Math.round(product.price * 100);
    const content = { id: product.id, name: product.name, content_type: 'product', quantity: item.qty };
    if (eventName === 'items_added') Object.assign(content, { amount: unitAmount, currency: 'USD' });
    contents.push(content);
    subtotal += unitAmount * item.qty;
  }
  const amount = eventName === 'items_added' || orderTotal === undefined ? subtotal : Math.round(orderTotal * 100);
  if (!Number.isSafeInteger(amount) || amount < 0) return null;
  return { type: 'contents', amount, currency: 'USD', contents };
}

async function trackPixelCommerceEvent(eventName, items, orderTotal) {
  // Build an immutable payload before awaiting identity; cart state may change.
  const payload = pixelCommercePayload(eventName, items, orderTotal);
  if (!payload) return;
  try {
    const ready = await syncPixelUser(currentUser);
    if (ready && typeof window.oaiq === 'function') window.oaiq('measure', eventName, payload);
    console.info("commerceEvent: "+ JSON.stringify(payload))
  } catch {
    console.warn('Nano Motion: shopping-event tracking unavailable.');
  }
}

async function trackPixelSubscriptionCreated(subscription) {
  if (!subscription || subscription.tier !== 'premium' || subscription.status !== 'active'
    || !Object.hasOwn(MEMBERSHIP_PLANS, subscription.plan)) return;
  const plan = MEMBERSHIP_PLANS[subscription.plan];
  const payload = {
    type: 'plan_enrollment',
    plan_id: plan.pixelPlanId,
    amount: Math.round(subscription.price * 100),
    currency: 'USD'
  };
  if (!Number.isSafeInteger(payload.amount) || payload.amount < 0) return;
  try {
    const ready = await syncPixelUser(currentUser);
    if (ready && typeof window.oaiq === 'function') window.oaiq('measure', 'subscription_created', payload);
    console.info("Subscription: "+ JSON.stringify(payload))
  } catch {
    console.warn('Nano Motion: subscription tracking unavailable.');
  }
}

async function trackPixelRegistrationCompleted(member) {
  if (!member?.username) return;
  try {
    const ready = await syncPixelUser(member);
    if (ready && typeof window.oaiq === 'function') {
      window.oaiq('measure', 'registration_completed', { type: 'customer_action' });
    }
  } catch {
    console.warn('Nano Motion: registration tracking unavailable.');
  }
}
