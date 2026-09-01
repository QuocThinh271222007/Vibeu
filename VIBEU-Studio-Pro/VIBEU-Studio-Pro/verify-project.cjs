const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {defaultNail,defaultLight,clamp}=require('./src/engine.js');
const {applyPreset}=require('./src/presets.js');
const SETS=require('./src/data.json');const app=fs.readFileSync(__dirname+'/src/app.js','utf8');
const names=app.slice(app.indexOf('const stickerNames='),app.indexOf('const presetInfo='));
const validation=app.slice(app.indexOf('function validateProject('),app.indexOf("$('#project-input').onchange="));
let n=0;const context=vm.createContext({SETS,defaultNail,clamp,uid:()=>String(++n)});vm.runInContext(names+'\n'+validation,context);
const base=()=>({format:'vibeu-studio-pro',version:1,model:{current:'cozy',selected:2,states:Object.fromEntries(SETS.map(s=>[s.id,s.nails.map(defaultNail)])),light:defaultLight()},assets:{}});
let passed=0;
for(const name of ['lavender','butter','pink','cloud','matcha','aurora']){const project=base();SETS.forEach(s=>applyPreset(project.model.states[s.id],name,defaultNail,s.nails));const cleaned=context.validateProject(JSON.parse(JSON.stringify(project)));assert.equal(cleaned.model.states.cozy.length,5);assert.equal(cleaned.model.states.matcha.length,5);passed++}
const corrupt=base();corrupt.model.states.cozy[0].paint.color='url(javascript:evil)';assert.throws(()=>context.validateProject(corrupt));passed++;
const badImage=base();badImage.assets.asset={name:'bad',src:'https://outside.example/a.jpg'};assert.throws(()=>context.validateProject(badImage));passed++;
const badGradient=base();badGradient.model.states.cozy[0].paint.stops=[];assert.throws(()=>context.validateProject(badGradient));passed++;
const badPoint=base();badPoint.model.states.cozy[0].paint.start=[NaN,1];assert.throws(()=>context.validateProject(badPoint));passed++;
const missing=base();missing.model.states.cozy[0].layers=[{kind:'image',u:.5,v:.5,size:1,rotation:0,opacity:1,color:'#ffffff',asset:'missing'}];assert.throws(()=>context.validateProject(missing));passed++;
console.log('Project validation: '+passed+' checks passed (six preset round trips; invalid color, external image, gradient, point and missing image rejected).');
fs.writeFileSync(__dirname+'/project-verification.json',JSON.stringify({passed,checks:'six preset round trips; invalid color, external image, gradient, point and missing image rejected',method:'Production validator function executed directly; no browser.'},null,2));
