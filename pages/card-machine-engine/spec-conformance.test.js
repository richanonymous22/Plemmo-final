global.window = global;
require('/home/user/Plemmo-final/pages/card-machine-engine/config.js');
require('/home/user/Plemmo-final/pages/card-machine-engine/engine.js');
const C = window.PLEMMO_CME_CONFIG, E = window.PLEMMO_CME_ENGINE;
let ok=0, bad=0; const fails=[];
const t=(n,c,e='')=>{ c?ok++:(bad++,fails.push(n)); console.log((c?'PASS':'FAIL')+'  '+n+(e?'  '+e:'')); };
const ids = r => r.providers.map(p=>p.id);
const rec = a => E.recommend(C, a);

console.log('── §14 CHARITY ──');
let r = rec({categoryId:'charity-non-profit', typeId:'registered-charity', turnoverBandId:'10000-15000', currentProviderId:'none', charityNoRental:true});
t('charity + no rental -> Shift4, SumUp', JSON.stringify(ids(r))===JSON.stringify(['shift4','sumup']), ids(r).join(','));
r = rec({categoryId:'charity-non-profit', typeId:'registered-charity', turnoverBandId:'10000-15000', currentProviderId:'shift4', charityNoRental:true});
t('charity + no rental + already Shift4 -> Shift4 excluded', ids(r).indexOf('shift4')===-1, ids(r).join(','));

console.log('\n── §15 FOOD & BEVERAGE: MOTO ignores turnover ──');
['below-5000','20000-30000','above-100000'].forEach(b=>{
  const rr = rec({categoryId:'food-beverage', typeId:'restaurant', turnoverBandId:b, currentProviderId:'none', foodBeveragePaymentMethod:'moto'});
  t(`F&B MOTO @ ${b} -> Elavon, Worldpay`, JSON.stringify(ids(rr))===JSON.stringify(['elavon','worldpay']), ids(rr).join(','));
});

console.log('\n── §15 FOOD & BEVERAGE: turnover ladder (Pay by Link / Neither) ──');
const ladder = [
  ['below-5000',   ['shift4']],
  ['5000-10000',   ['sumup','shift4']],
  ['10000-15000',  ['teya','worldpay','sumup']],
  ['15000-20000',  ['teya','worldpay','sumup']],
  ['20000-30000',  ['teya','elavon','clover']],
  ['30000-35000',  ['elavon','clover','teya']],
];
['pay-by-link','neither'].forEach(mode=>{
  ladder.forEach(([band,want])=>{
    const rr = rec({categoryId:'food-beverage', typeId:'cafe', turnoverBandId:band, currentProviderId:'none', foodBeveragePaymentMethod:mode});
    t(`F&B ${mode} @ ${band} -> ${want.join(',')}`, JSON.stringify(ids(rr))===JSON.stringify(want), ids(rr).join(','));
  });
});

console.log('\n── §15 below £5k + already Shift4 -> SumUp ──');
r = rec({categoryId:'food-beverage', typeId:'bakery', turnoverBandId:'below-5000', currentProviderId:'shift4', foodBeveragePaymentMethod:'neither'});
t('below £5k, uses Shift4 -> SumUp', JSON.stringify(ids(r))===JSON.stringify(['sumup']), ids(r).join(','));

console.log('\n── §13 Rule 1/2 CURRENT PROVIDER EXCLUSION (all providers) ──');
['teya','shift4','sumup','clover','elavon','worldpay'].forEach(p=>{
  const rr = rec({categoryId:'food-beverage', typeId:'restaurant', turnoverBandId:'20000-30000', currentProviderId:p, foodBeveragePaymentMethod:'neither'});
  t(`current=${p} never recommended`, ids(rr).indexOf(p)===-1, ids(rr).join(',')||'(none)');
});

console.log('\n── §12 HIGH / LOW ATV CLASSIFICATION ──');
const atvCases = [
  ['leisure-entertainment','hotel','high'], ['leisure-entertainment','travel-agency','high'],
  ['retail','electronics-store','high'],    ['retail','jewellery-store','high'],
  ['retail','florist','high'],              ['services','accountant','high'],
  ['services','taxi','high'],               ['services','garage','high'],
  ['food-beverage','restaurant','low'],     ['food-beverage','cafe','low'],
  ['retail','grocery-store','low'],         ['retail','convenience-store','low'],
  ['retail','clothing-store','low'],        ['retail','vape-shop','low'],
  ['retail','pet-shop','low'],              ['health-beauty-wellness','barber','low'],
  ['health-beauty-wellness','pharmacy','low'],
];
atvCases.forEach(([cat,type,want])=>{
  const c = E.findCategory(C,cat); const ty = c && E.findType(c,type);
  t(`${type} -> ${want} ATV`, ty && ty.atv===want, ty?ty.atv:'TYPE NOT FOUND');
});

console.log('\n── §22 CLOVER pricing tables (Low vs High ATV) ──');
const cloverLow = [[20000,0.45,0.75],[40000,0.40,0.72],[60000,0.35,0.68],[100000,0.30,0.65],[150000,0.28,0.65]];
const cloverHigh= [[20000,0.45,0.75],[40000,0.40,0.70],[60000,0.35,0.65],[100000,0.30,0.60],[150000,0.28,0.58]];
cloverLow.forEach(([v,d,c2])=>{ const p=E.formatProviderPricing(C,'clover',v,'low');
  t(`Clover LOW @£${v.toLocaleString()} = ${d}/${c2}`, p.debit===d&&p.credit===c2, `${p.debit}/${p.credit}`); });
cloverHigh.forEach(([v,d,c2])=>{ const p=E.formatProviderPricing(C,'clover',v,'high');
  t(`Clover HIGH @£${v.toLocaleString()} = ${d}/${c2}`, p.debit===d&&p.credit===c2, `${p.debit}/${p.credit}`); });
let cp=E.formatProviderPricing(C,'clover',20000,'low');
t('Clover auth fee 2p', cp.authorisationFee===0.02||cp.authorisationFee===2, String(cp.authorisationFee));
t('Clover rental £24', cp.rental===24, String(cp.rental));
t('Clover £1/6mo promo present', !!cp.rentalPromo, JSON.stringify(cp.rentalPromo));

console.log('\n── §23 ELAVON pricing tables ──');
const elLow = [[20000,0.35,0.65,0.02],[40000,0.32,0.60,0.02],[50000,0.30,0.60,0.02],[100001,0.29,0.55,0.02]];
const elHigh= [[20000,0.55,0.75,0.03],[40000,0.40,0.70,0.03],[50000,0.35,0.55,0.02],[100001,0.32,0.55,0.02]];
elLow.forEach(([v,d,c2,a])=>{ const p=E.formatProviderPricing(C,'elavon',v,'low');
  t(`Elavon LOW @£${v.toLocaleString()} = ${d}/${c2}/${a}`, p.debit===d&&p.credit===c2&&p.authorisationFee===a, `${p.debit}/${p.credit}/${p.authorisationFee}`); });
elHigh.forEach(([v,d,c2,a])=>{ const p=E.formatProviderPricing(C,'elavon',v,'high');
  t(`Elavon HIGH @£${v.toLocaleString()} = ${d}/${c2}/${a}`, p.debit===d&&p.credit===c2&&p.authorisationFee===a, `${p.debit}/${p.credit}/${p.authorisationFee}`); });
t('Elavon rental £19.99', E.formatProviderPricing(C,'elavon',20000,'low').rental===19.99);

console.log('\n── §24 WORLDPAY ──');
let wp=E.formatProviderPricing(C,'worldpay',15000,'low');
t('Worldpay £15-20k = 0.35/0.75', wp.debit===0.35&&wp.credit===0.75, `${wp.debit}/${wp.credit}`);
wp=E.formatProviderPricing(C,'worldpay',20001,'low');
t('Worldpay above £20k = 0.30/0.75', wp.debit===0.30&&wp.credit===0.75, `${wp.debit}/${wp.credit}`);

console.log('\n── §17 TEYA blended table ──');
[[10000,1.20],[15000,1.00],[20000,0.90],[25000,0.82],[30000,0.82],[50000,0.75],[100001,0.67],[110000,0.65],[150001,0.60]].forEach(([v,rate])=>{
  const p=E.formatProviderPricing(C,'teya',v,'low');
  t(`Teya @£${v.toLocaleString()} = ${rate}%`, p.blendedRate===rate, String(p.blendedRate));
});

console.log('\n── §18/§20 SHIFT4 + blended display rules ──');
let s4=E.formatProviderPricing(C,'shift4',9999,'low');
t('Shift4 below £10k = 1.25%', s4.blendedRate===1.25, String(s4.blendedRate));
s4=E.formatProviderPricing(C,'shift4',10000,'low');
t('Shift4 from £10k = 0.70%', s4.blendedRate===0.70, String(s4.blendedRate));
['teya','shift4','sumup'].forEach(p=>{ const x=E.formatProviderPricing(C,p,20000,'low');
  t(`${p} exposes NO debit/credit/auth`, x.debit===undefined&&x.credit===undefined&&x.authorisationFee===undefined); });
t('SumUp exposes no rate table', E.formatProviderPricing(C,'sumup',20000,'low').blendedRate==null);

console.log(`\n${ok} passed, ${bad} failed`);
if(fails.length) console.log('FAILED:\n  '+fails.join('\n  '));
