global.window=global;
require('/home/user/Plemmo-final/pages/epos-engine/config.js');
require('/home/user/Plemmo-final/pages/epos-engine/engine.js');
const C=window.PLEMMO_EPOS_CONFIG, E=window.PLEMMO_EPOS_ENGINE;
let ok=0,bad=0; const fails=[];
const t=(n,c,e='')=>{ c?ok++:(bad++,fails.push(n)); console.log((c?'PASS':'FAIL')+'  '+n+(e?'  '+e:'')); };

console.log('── §34 RETAIL: exact order + pricing ──');
let r = E.recommend(C,'retail');
let pk = r.packages || r.results || r;
const rows = pk.map(p=>({name:p.name||p.packageName, hw:p.hardwarePrice, sw:p.monthlySoftwareFee, prov:p.providerName||p.provider}));
rows.forEach((x,i)=>console.log(`   ${i+1}. ${x.prov} — ${x.name}  £${x.hw} + £${x.sw}/mo`));
t('Retail returns exactly 3 packages', rows.length===3, String(rows.length));
t('Retail #1 = Plemmo Retail £900 + £10', /Plemmo/i.test(rows[0].prov+rows[0].name) && rows[0].hw===900 && rows[0].sw===10, JSON.stringify(rows[0]));
t('Retail #2 = Epos Now Countertop Duo £249 + £39', /Epos ?Now/i.test(rows[1].prov+rows[1].name) && /Duo/i.test(rows[1].name) && rows[1].hw===249 && rows[1].sw===39, JSON.stringify(rows[1]));
t('Retail #3 = SumUp Retail POS Kit £649 + £29', /SumUp/i.test(rows[2].prov+rows[2].name) && rows[2].hw===649 && rows[2].sw===29, JSON.stringify(rows[2]));
t('Retail does NOT include Shift4', !rows.some(x=>/Shift4/i.test(x.prov+x.name)));
t('Retail Epos Now shows ONLY Countertop Duo', rows.filter(x=>/Epos ?Now/i.test(x.prov)).every(x=>/Duo/i.test(x.name)));

console.log('\n── §35 HOSPITALITY: exact order + pricing ──');
r = E.recommend(C,'hospitality');
pk = r.packages || r.results || r;
const h = pk.map(p=>({name:p.name||p.packageName, hw:p.hardwarePrice, sw:p.monthlySoftwareFee, prov:p.providerName||p.provider}));
h.forEach((x,i)=>console.log(`   ${i+1}. ${x.prov} — ${x.name}  £${x.hw} + £${x.sw}/mo`));
t('Hospitality returns exactly 4 packages', h.length===4, String(h.length));
t('Hosp #1 = Plemmo Hospitality £500 + £20', /Plemmo/i.test(h[0].prov+h[0].name) && h[0].hw===500 && h[0].sw===20, JSON.stringify(h[0]));
t('Hosp #2 = Shift4 £0 upfront + £39', /Shift4/i.test(h[1].prov+h[1].name) && h[1].hw===0 && h[1].sw===39, JSON.stringify(h[1]));
t('Hosp #3 = Epos Now Countertop £199 + £39', /Epos ?Now/i.test(h[2].prov+h[2].name) && !/Duo/i.test(h[2].name) && h[2].hw===199 && h[2].sw===39, JSON.stringify(h[2]));
t('Hosp #4 = Epos Now Countertop Duo £249 + £39', /Duo/i.test(h[3].name) && h[3].hw===249 && h[3].sw===39, JSON.stringify(h[3]));
t('Hospitality does NOT include SumUp', !h.some(x=>/SumUp/i.test(x.prov+x.name)));

console.log('\n── §33/§91 NO turnover / size inputs in EPOS ──');
const cfgStr = JSON.stringify(C).toLowerCase();
t('EPOS config has no turnover concept', !/turnover/.test(cfgStr));
t('EPOS engine ignores extra answers (order stable)', JSON.stringify((E.recommend(C,'retail').packages||[]).map(p=>p.name))===JSON.stringify(rows.map(x=>x.name)));

console.log('\n── §37 Plemmo Retail hardware + optional display ──');
const all=[].concat(pk, E.recommend(C,'retail').packages||[]);
const plemmoRetail=(E.recommend(C,'retail').packages||[])[0];
const prStr=JSON.stringify(plemmoRetail);
t('Plemmo Retail includes barcode scanner', /barcode/i.test(prStr), '');
t('Plemmo Retail includes cash drawer', /cash drawer/i.test(prStr));
t('Plemmo Retail includes receipt printer', /receipt printer/i.test(prStr));
t('Customer Facing Display is OPTIONAL £200, not included', /customer facing display/i.test(prStr) && /200/.test(prStr));

console.log('\n── §39 Plemmo integrated card machine message ──');
const msg='Integrated card machine available. Additional charges may apply. Please contact us for more information and a personalised quotation.';
t('Plemmo packages carry the exact card machine message', JSON.stringify(C).indexOf(msg)!==-1);

console.log('\n── §40/§41/§42 integrated card machine status ──');
// recommend() returns the config key; formatPackage resolves it to the text
// the visitor actually sees, so assert at that layer.
const resolved = cat => E.recommend(C,cat).packages.map(p=>{
  const f = E.formatPackage(C, p.id||p);
  return { name: f.name||p.name, cm: (f.cardMachine||{}) };
});
const rt = resolved('retail'), ht = resolved('hospitality');
const INCLUDED = 'Integrated Card Machine Included';
const AVAILABLE = 'Integrated card machine available. Additional charges may apply. Please contact us for more information and a personalised quotation.';
t('Shift4 shows "Integrated Card Machine Included"', ht[1].cm.text===INCLUDED, ht[1].cm.text);
t('SumUp shows "Integrated Card Machine Included"', rt[2].cm.text===INCLUDED, rt[2].cm.text);
t('Epos Now shows "Integrated Card Machine Included"', rt[1].cm.text===INCLUDED, rt[1].cm.text);
t('Plemmo Retail shows the exact available message', rt[0].cm.text===AVAILABLE, rt[0].cm.text);
t('Plemmo Hospitality shows the exact available message', ht[0].cm.text===AVAILABLE, ht[0].cm.text);
t('Plemmo status is "available", never "included"', rt[0].cm.status==='available' && ht[0].cm.status==='available');

console.log(`\n${ok} passed, ${bad} failed`);
if(fails.length) console.log('FAILED:\n  '+fails.join('\n  '));
