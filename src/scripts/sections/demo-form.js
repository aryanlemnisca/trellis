import { field } from '../lib/fields.js';

export function initDemoForm(){
/* form */
/* Webhook URL: a <meta name="demo-form-hook"> tag (set when hosting the standalone file) or the build env PUBLIC_DEMO_FORM_HOOK. Never hard-coded in git. */
const DEMO_HOOK=(document.querySelector('meta[name="demo-form-hook"]')||{}).content||import.meta.env.PUBLIC_DEMO_FORM_HOOK||'';
const demoForm=document.getElementById('demoForm');
const $=id=>document.getElementById(id);
const fName=$('f-name'),fEmail=$('f-email'),fOrg=$('f-org'),fHp=$('f-website');
const submitBtn=demoForm.querySelector('button[type=submit]'),submitLbl=submitBtn.querySelector('.lbl');
const statusBox=$('formStatus'),done=$('formDone');
const NAME_RE=/^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$/u;
const EMAIL_RE=/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const rules={
  'f-name':v=>!v?'Enter your name.':v.length<2?'Name must be at least 2 characters.':v.length>80?'Name must be 80 characters or fewer.':!NAME_RE.test(v)?'Use letters, spaces, hyphens or apostrophes only.':'',
  'f-email':v=>!v?'Enter your work email.':v.length>254?'Email is too long.':!EMAIL_RE.test(v)?'Enter a valid email, like name@company.com.':'',
  'f-org':v=>!v?'Enter your organization.':v.length<2?'Organization must be at least 2 characters.':v.length>120?'Organization must be 120 characters or fewer.':!/[\p{L}\p{N}]/u.test(v)?'Enter a valid organization name.':''
};
const touched=new Set();
function validate(input,{shake=false}={}){
  const v=input.value.replace(/\s+/g,' ').trim(),err=rules[input.id](v),field=input.closest('.field');
  $(input.id+'-msg').textContent=err;
  input.setAttribute('aria-invalid',err?'true':'false');
  field.classList.toggle('invalid',!!err);field.classList.toggle('valid',!err&&!!v);
  if(err&&shake){field.classList.remove('shake');void field.offsetWidth;field.classList.add('shake');}
  return !err;
}
[fName,fEmail,fOrg].forEach(i=>{
  i.addEventListener('blur',()=>{if(i.value.trim()||touched.has(i.id)){touched.add(i.id);validate(i);}});
  i.addEventListener('input',()=>{if(touched.has(i.id))validate(i);if(!statusBox.hidden&&demoForm.dataset.state==='error')setState('idle');});
  i.closest('.field').addEventListener('animationend',e=>e.currentTarget.classList.remove('shake'));
});
function setState(s,{title='',text=''}={}){
  demoForm.dataset.state=s;demoForm.setAttribute('aria-busy',s==='sending');
  const busy=s==='sending';submitBtn.disabled=busy;[fName,fEmail,fOrg].forEach(i=>i.readOnly=busy);
  submitLbl.textContent=busy?'Sending…':s==='error'?'Try again →':'Book a demo →';
  statusBox.hidden=s!=='error';$('formStatusTitle').textContent=title;$('formStatusText').textContent=text;
  done.hidden=s!=='success';
}
demoForm.addEventListener('submit',async e=>{e.preventDefault();
  if(demoForm.dataset.state==='sending')return;
  const fields=[fName,fEmail,fOrg];fields.forEach(i=>touched.add(i.id));
  const results=fields.map(i=>validate(i,{shake:true}));
  const firstBad=fields[results.indexOf(false)];
  if(firstBad){firstBad.focus();return;}
  const data={name:fName.value.replace(/\s+/g,' ').trim(),email:fEmail.value.trim().toLowerCase(),organization:fOrg.value.replace(/\s+/g,' ').trim()};
  const showDone=()=>{$('formDoneText').textContent=`Thanks, ${data.name.split(' ')[0]}. We'll email ${data.email} soon to schedule your demo.`;setState('success');done.focus();};
  if(fHp.value){showDone();return;} // bot trap: pretend success, send nothing
  if(!DEMO_HOOK){setState('error',{title:'This form isn’t connected yet.',text:' Please try again later.'});return;}
  if(!navigator.onLine){setState('error',{title:'You appear to be offline.',text:' Check your connection and try again. Your details are saved in the form.'});return;}
  setState('sending');
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
  try{
    const r=await fetch(DEMO_HOOK,{method:'POST',signal:ctrl.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({
      ...data,source:'trellis-home',page:location.href,submittedAt:new Date().toISOString()})});
    if(!r.ok){const er=new Error('http');er.status=r.status;throw er;}
    showDone();
  }catch(err){
    const msg=err.name==='AbortError'?{title:'The request timed out.',text:' Our server took too long to respond. Please try again.'}
      :err.status===429?{title:'Too many attempts.',text:' Please wait a minute and try again.'}
      :err.status>=400&&err.status<500?{title:'We couldn’t accept that submission.',text:' Please check your details and try again.'}
      :err.status?{title:'Something went wrong on our side.',text:' Please try again in a moment.'}
      :{title:'Couldn’t reach our server.',text:' Check your connection and try again.'};
    setState('error',msg);
  }finally{clearTimeout(timer);}
});
$('formAgain').addEventListener('click',()=>{demoForm.reset();touched.clear();
  [fName,fEmail,fOrg].forEach(i=>{i.closest('.field').classList.remove('invalid','valid');i.removeAttribute('aria-invalid');$(i.id+'-msg').textContent='';});
  setState('idle');fName.focus();});
}
