import Stripe from "stripe";

// Run only with the intended Stripe account's server-side key.
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('[SENSITIVE]')) {
  throw new Error('A usable STRIPE_SECRET_KEY is required.');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const apply = process.argv.includes('--apply');
const tiers = [['basic', 249], ['growth', 449], ['network', 699]];
const productKey = 'aftercare-virtual-organization-v1';
let product;
for await (const candidate of stripe.products.list({ active: true, limit: 100 })) {
  if (candidate.metadata.catalogKey === productKey) { product = candidate; break; }
}
if (!product && apply) product = await stripe.products.create({
  name: 'Aftercare Compass — Virtual Continued Care',
  metadata: { catalogKey: productKey }
}, { idempotencyKey: productKey });
for (const [tier, monthly] of tiers) {
  for (const cycle of ['monthly', 'annual']) {
    const lookup = `aftercare_virtual_${tier}_${cycle}_v1`;
    const amount = monthly * (cycle === 'annual' ? 10 : 1) * 100;
    const interval = cycle === 'annual' ? 'year' : 'month';
    let price = (await stripe.prices.list({ lookup_keys: [lookup], limit: 1 })).data[0];
    if (price && (price.unit_amount !== amount || price.currency !== 'usd' || price.recurring?.interval !== interval || !price.active)) {
      throw new Error(`Existing price ${lookup} differs from the approved plan. Review it before continuing.`);
    }
    if (!price && apply) price = await stripe.prices.create({
      product: product.id, currency: 'usd', unit_amount: amount,
      recurring: { interval }, lookup_key: lookup,
      nickname: `Virtual ${tier} — ${cycle}`,
      metadata: { plan: `virtual_${tier}`, billingCycle: cycle }
    }, { idempotencyKey: lookup });
    console.log(`STRIPE_AFTERCARE_VIRTUAL_${tier.toUpperCase()}_${cycle.toUpperCase()}_PRICE_ID=${price?.id || `[would create USD ${amount / 100}/${interval}]`}`);
  }
}
