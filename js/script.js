(function(){
  var root=document.documentElement, body=document.body;
  var sizes=[90,100,112,125,140], idx=1;
  function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function load(k){try{return localStorage.getItem(k)}catch(e){return null}}

  /* text size */
  var saved=parseInt(load('sn-size'),10);
  if(!isNaN(saved)&&saved>=0&&saved<sizes.length)idx=saved;
  function applySize(){root.style.fontSize=sizes[idx]+'%';store('sn-size',idx)}
  applySize();
  function on(id,fn){var el=document.getElementById(id);if(el)el.addEventListener('click',fn)}
  on('font-inc',function(){if(idx<sizes.length-1){idx++;applySize()}});
  on('font-dec',function(){if(idx>0){idx--;applySize()}});
  on('font-reset',function(){idx=1;applySize()});

  /* high contrast */
  var cBtn=document.getElementById('contrast-toggle');
  function setContrast(on){body.classList.toggle('high-contrast',on);if(cBtn)cBtn.setAttribute('aria-pressed',on);store('sn-contrast',on?'1':'0')}
  setContrast(load('sn-contrast')==='1');
  if(cBtn)cBtn.addEventListener('click',function(){setContrast(!body.classList.contains('high-contrast'))});

  /* mobile menu */
  var toggle=document.getElementById('menu-toggle'), nav=document.getElementById('main-nav');
  if(toggle&&nav)toggle.addEventListener('click',function(){
    var open=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded',open);
    toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
  });

  /* contact form */
  var form=document.getElementById('enquiry-form');
  if(!form)return;
  var pkg=new URLSearchParams(location.search).get('package');
  var select=document.getElementById('package');
  if(pkg&&select&&select.querySelector('option[value="'+pkg+'"]'))select.value=pkg;

  function setError(input,msg){
    var field=input.closest('.form-field'), old=field.querySelector('.error');
    if(old)old.remove();
    input.removeAttribute('aria-invalid');
    if(msg){
      var p=document.createElement('p');p.className='error';p.id=input.id+'-error';p.textContent=msg;
      field.appendChild(p);input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',p.id);
    }
    return !msg;
  }
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var name=form.name, email=form.email, message=form.message, ok=true, first=null;
    function check(input,msg){if(!setError(input,msg)){ok=false;if(!first)first=input}}
    check(name,name.value.trim()?'':'Enter your full name.');
    check(email,!email.value.trim()?'Enter your email address.':(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)?'':'Enter a valid email, like name@example.com.'));
    check(message,message.value.trim()?'':'Write a short message so we know how to help.');
    var status=document.getElementById('form-status');
    if(!ok){status.style.color='#b3261e';status.textContent='Please fix the highlighted fields.';first.focus();return}
    status.style.color='';
    status.textContent='Thanks, '+name.value.trim().split(' ')[0]+'. We\u2019ll reply within one working day.';
    form.reset();
  });
})();

/* ---------- Site search (client-side, no server needed) ---------- */
(function(){
  var form=document.getElementById('site-search');
  if(!form)return;
  var input=document.getElementById('search-input'), list=document.getElementById('search-results'), status=document.getElementById('search-status');
  var INDEX=[
    {t:'Home',p:'Home',u:'index.html',k:'home welcome live well belong singapore co-living flexible furnished',d:'Flexible, fully-furnished co-living in Singapore.'},
    {t:'About SkyNest',p:'Home',u:'index.html#about-heading',k:'about company story community remote workers students nomads custom package',d:'A Singapore co-living company for people who move often.'},
    {t:'What residents say',p:'Home',u:'index.html#testi-heading',k:'testimonials reviews residents ravi mei jonas feedback',d:'Reviews from residents and a corporate booking.'},
    {t:'Fully furnished private rooms',p:'Facilities',u:'facilities.html#core-fac-heading',k:'room bedroom furnished bed desk storage linens private',d:'A bed, desk, storage and linens are ready before you arrive.'},
    {t:'Shared co-working spaces',p:'Facilities',u:'facilities.html#core-fac-heading',k:'co-working coworking work desk office remote study',d:'Dedicated desks separate from your room.'},
    {t:'Communal kitchens & dining',p:'Facilities',u:'facilities.html#core-fac-heading',k:'kitchen cook cooking dining food meals communal',d:'Full kitchens shared across each floor.'},
    {t:'High-speed Wi-Fi',p:'Facilities',u:'facilities.html#core-fac-heading',k:'wifi wi-fi internet broadband connection video calls',d:'Building-wide coverage included in every stay.'},
    {t:'Laundry rooms',p:'Facilities',u:'facilities.html#core-fac-heading',k:'laundry washer dryer washing clothes',d:'On-site washers and dryers.'},
    {t:'24/7 security & key-card access',p:'Facilities',u:'facilities.html#core-fac-heading',k:'security safe key card keycard access guard entry',d:'Controlled entry with security on site around the clock.'},
    {t:'Rooftop garden, gym, lounge & study pods',p:'Facilities',u:'facilities.html#extra-fac-heading',k:'rooftop garden gym yoga studio lounge social study pods events community perks',d:'Extra perks including weekly community events.'},
    {t:'Accessibility',p:'Facilities',u:'facilities.html#accessible-heading',k:'accessible accessibility wheelchair lift step-free disability needs',d:'Lifts to every floor and step-free routes to shared spaces.'},
    {t:'Short-Term Stay',p:'Packages',u:'packages.html#packages-heading',k:'short term short-term 1-4 weeks flexible quick move project',d:'1–4 weeks, furnished room, utilities included.'},
    {t:'Standard Stay',p:'Packages',u:'packages.html#packages-heading',k:'standard private bedroom shared apartment fortnightly cleaning student',d:'Private bedroom in a shared apartment.'},
    {t:'Premium Stay',p:'Packages',u:'packages.html#packages-heading',k:'premium studio private apartment weekly cleaning events pass internet',d:'Private studio with weekly cleaning and all facilities.'},
    {t:'Custom packages',p:'Packages',u:'packages.html#packages-heading',k:'custom corporate long-term long term accessibility business company staff',d:'Corporate, long-term and accessibility bookings arranged with our team.'},
    {t:'Which package fits?',p:'Packages',u:'packages.html#advice-heading',k:'which choose compare help advice decide price cost',d:'Guidance on choosing the right stay.'},
    {t:'Send an enquiry',p:'Contact',u:'contact.html#contact-heading',k:'contact enquiry form message email write book tour booking',d:'Send us a message and we reply within one working day.'},
    {t:'Phone, email & WhatsApp',p:'Contact',u:'contact.html',k:'phone call number email whatsapp address location map office hours visit',d:'Contact details, address and office hours.'},
    {t:'Common questions',p:'Contact',u:'contact.html#faq-heading',k:'faq questions reply visit tour custom how quickly',d:'Custom packages, reply times and visiting before booking.'}
  ];
  var active=-1, shown=[];
  function norm(s){return (s||'').toLowerCase().replace(/[^a-z0-9\s-]/g,' ');}
  function search(q){
    var words=norm(q).split(/\s+/).filter(function(w){return w.length>1;});
    if(!words.length)return [];
    return INDEX.map(function(e){
      var title=norm(e.t), body=norm(e.k+' '+e.d+' '+e.p), s=0;
      words.forEach(function(w){
        if(title.indexOf(w)>-1)s+=3;
        if(body.indexOf(w)>-1)s+=1;
      });
      return {e:e,s:s};
    }).filter(function(r){return r.s>0;}).sort(function(a,b){return b.s-a.s;}).slice(0,6).map(function(r){return r.e;});
  }
  function close(){list.hidden=true;input.setAttribute('aria-expanded','false');active=-1;input.removeAttribute('aria-activedescendant');}
  function setActive(i){
    var items=list.querySelectorAll('[role="option"]');
    items.forEach(function(el,n){el.setAttribute('aria-selected',n===i?'true':'false');});
    active=i; if(items[i])input.setAttribute('aria-activedescendant',items[i].id); else input.removeAttribute('aria-activedescendant');
  }
  function render(q){
    list.innerHTML=''; shown=search(q);
    if(!q.trim()){close();status.textContent='';return;}
    if(!shown.length){
      var li=document.createElement('li');li.className='no-results';li.textContent='No results for “'+q.trim()+'”. Try “wifi”, “kitchen” or “premium”.';
      list.appendChild(li);status.textContent='No results found';
    }else{
      shown.forEach(function(e,n){
        var li=document.createElement('li');li.setAttribute('role','option');li.id='search-opt-'+n;li.setAttribute('aria-selected','false');
        var a=document.createElement('a');a.href=e.u;
        var t=document.createElement('strong');t.textContent=e.t;
        var tag=document.createElement('span');tag.className='tag';tag.textContent=e.p;
        var d=document.createElement('span');d.className='desc';d.textContent=e.d;
        a.appendChild(t);a.appendChild(tag);a.appendChild(d);li.appendChild(a);list.appendChild(li);
      });
      status.textContent=shown.length+(shown.length===1?' result':' results')+' available';
    }
    list.hidden=false;input.setAttribute('aria-expanded','true');active=-1;
  }
  input.addEventListener('input',function(){render(input.value);});
  input.addEventListener('focus',function(){if(input.value.trim())render(input.value);});
  input.addEventListener('keydown',function(e){
    var n=shown.length;
    if(e.key==='ArrowDown'&&n){e.preventDefault();setActive((active+1)%n);}
    else if(e.key==='ArrowUp'&&n){e.preventDefault();setActive((active-1+n)%n);}
    else if(e.key==='Escape'){close();}
  });
  form.addEventListener('submit',function(e){
    e.preventDefault(); render(input.value);
    var target=shown[active>-1?active:0];
    if(target)location.href=target.u;
  });
  document.addEventListener('click',function(e){if(!form.contains(e.target))close();});
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)){e.preventDefault();input.focus();}
  });
})();
