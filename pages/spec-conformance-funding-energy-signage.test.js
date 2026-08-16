global.window=global;
let ok=0,bad=0;const fails=[];
const t=(n,c,e='')=>{c?ok++:(bad++,fails.push(n));console.log((c?'PASS':'FAIL')+'  '+n+(e?'  '+e:''));};
const load=p=>{delete global.PLEMMO_FIN_CONFIG;require(p);};
const R='/home/user/Plemmo-final/pages/';
const fs=require('fs');

// ---------- FUNDING ----------
require(R+'finance-engine/config.js');
const FIN=Object.keys(global).filter(k=>/PLEMMO_(FIN|FN)/.test(k)).map(k=>global[k])[0];
const finStr=JSON.stringify(FIN);
console.log('── FUNDING (spec §48-§55) ──');
['£10,000','£25,000','£50,000','£100,000','£250,000'].forEach(a=>t('funding amount option '+a, finStr.includes(a)));
['Working Capital','Business Expansion','Equipment Purchase','Stock Purchase','Cash Flow','Commercial Property','Vehicle Purchase','Tax Funding','VAT Funding','Business Acquisition','Debt Consolidation','Other'].forEach(p=>t('funding purpose: '+p, finStr.includes(p)));
['Sole Trader','Partnership','Limited Company','LLP'].forEach(b=>t('business type: '+b, finStr.includes(b)));
['Retail','Hospitality','Construction','Healthcare','Manufacturing','Professional Services','Transport','Property','Wholesale'].forEach(s=>t('sector: '+s, finStr.includes(s)));
['Under 12 Months','1–2 Years','2–5 Years','5+ Years'].forEach(x=>t('time trading: '+x, finStr.includes(x)));
['Business Loan','Working Capital Loan','Asset Finance','Vehicle Finance','Commercial Mortgage','Bridging Finance','Invoice Finance','Merchant Cash Advance','VAT Loan','Tax Loan','Revolving Credit Facility'].forEach(p=>t('finance PRODUCT: '+p, finStr.includes(p)));
t('§51 introducer notice present', finStr.includes('introducer only') && finStr.includes('do not provide loans'));
// §54 restrictions
t('§54 no lender names (YouLend/iwoca/Funding Circle)', !/YouLend|iwoca|Funding Circle|Bizcap|Capify/i.test(finStr));
t('§54 no APR', !/\bAPR\b/i.test(finStr));
t('§54 no interest-rate comparison', !/interest rate/i.test(finStr));

// ---------- ENERGY ----------
require(R+'energy-engine/config.js');
const EN=Object.keys(global).filter(k=>/PLEMMO_(EN|ENERGY)/.test(k)).map(k=>global[k])[0];
const enStr=JSON.stringify(EN);
console.log('\n── ENERGY (spec §56-§64) ──');
['British Gas','EDF','E.ON Next','ScottishPower','SSE','Octopus Energy','TotalEnergies','Yu Energy','Utility Warehouse'].forEach(s=>t('supplier: '+s, enStr.includes(s)));
['In Contract','Out of Contract','Contract Ending Soon','Not Sure'].forEach(x=>t('contract status: '+x, enStr.includes(x)));
['Smart Meter','Standard Meter','Half-Hourly Meter'].forEach(x=>t('meter type: '+x, enStr.includes(x)));
['Fixed','Variable'].forEach(x=>t('tariff type: '+x, enStr.includes(x)));
['Business Electricity','Business Gas','Dual Fuel','Smart Meters','Meter Installations','Multi-Site Energy','Renewable Energy','Contract Renewals'].forEach(x=>t('service card: '+x, enStr.includes(x)));
t('§58 no fake live pricing (no p/kWh figures)', !/p\/kWh|per kWh/i.test(enStr), '');
t('§62 required documents incl. latest energy bill', /latest energy bill/i.test(enStr));

// ---------- SIGNAGE ----------
require(R+'signage-engine/config.js');
const SG=global.PLEMMO_SIGNAGE_CONFIG;
const sgStr=JSON.stringify(SG);
console.log('\n── SIGNAGE (spec §65-§77) ──');
['Restaurant','Café','Coffee Shop','Fast Food','Takeaway','Bakery','Dessert Shop','Supermarket','Convenience Store','Retail Shop','Salon','Barbershop','Pharmacy','Hotel','Reception Area','Office','Other'].forEach(x=>t('business type: '+x, sgStr.includes(x)));
['Digital Menu Board','Promotional Digital Screen','Window Display Screen','Advertising Display','Professional Menu Design','Promotional Poster Design','Social Media Design','Existing Menu Update','Screen & Design Package'].forEach(x=>t('service: '+x, sgStr.includes(x)));
const s32=SG.screenSizes.find(s=>s.id==='32in'), s40=SG.screenSizes.find(s=>s.id==='40in');
t('§69 32" = £350', s32.price===350, String(s32.price));
t('§69 40" = £400', s40.price===400, String(s40.price));
t('§69 32" includes display + menu design', JSON.stringify(s32.includes)===JSON.stringify(['Digital Display','Professional Menu Design']));
t('§68 Other/Not Sure size offered', SG.screenSizes.some(s=>/other|not sure/i.test(s.label)));
['Menu Design','Promotional Screen Design','Window Advertising Design','Social Media Design'].forEach(x=>t('design service: '+x, sgStr.includes(x)));
['Professional Design','Modern Layouts','High Resolution Graphics','Brand Colour Matching','Easy to Read Menus','Fast Turnaround'].forEach(x=>t('design feature: '+x, sgStr.includes(x)));

console.log(`\n${ok} passed, ${bad} failed`);
if(fails.length) console.log('FAILED:\n  '+fails.join('\n  '));
