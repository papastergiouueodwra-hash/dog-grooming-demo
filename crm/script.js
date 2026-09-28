const STORAGE_KEY='maisonPawsAppointments';
const statusLabels={scheduled:'Προγραμματισμένο',completed:'Ολοκληρώθηκε',cancelled:'Ακυρώθηκε'};
const statusClass={scheduled:'scheduled',completed:'completed',cancelled:'cancelled'};
const appointmentsEl=document.getElementById('appointments');
const emptyEl=document.getElementById('empty');
const searchEl=document.getElementById('search');
const today=new Date();
document.getElementById('todayLabel').textContent=today.toLocaleDateString('el-GR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase();

const seed=[
 {id:'demo-1',dogName:'Luna',phone:'6900000001',email:'luna@example.com',service:'Full Groom',date:'2026-09-29',time:'11:00',status:'scheduled'},
 {id:'demo-2',dogName:'Milo',phone:'6900000002',email:'milo@example.com',service:'Bath & Blow Dry',date:'2026-09-28',time:'15:00',status:'completed'},
 {id:'demo-3',dogName:'Bruno',phone:'6900000003',email:'bruno@example.com',service:'Nails & Hygiene',date:'2026-09-30',time:'10:00',status:'cancelled'}
];

function load(){
  const saved=localStorage.getItem(STORAGE_KEY);
  if(saved===null){localStorage.setItem(STORAGE_KEY,JSON.stringify(seed));return seed}
  try{return JSON.parse(saved)||[]}catch{return []}
}
function save(list){localStorage.setItem(STORAGE_KEY,JSON.stringify(list))}
function formatDate(value){
  if(!value)return '—';
  return new Date(value+'T12:00:00').toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'})
}
function render(){
  const all=load();
  const active=document.querySelector('.filter.active')?.dataset.filter||'all';
  const query=searchEl.value.trim().toLowerCase();
  const list=all.filter(a=>(active==='all'||a.status===active)&&(!query||a.dogName.toLowerCase().includes(query)||a.phone.includes(query)||a.email.toLowerCase().includes(query)));
  document.getElementById('todayCount').textContent=all.filter(a=>a.date===new Date().toISOString().slice(0,10)&&a.status!=='cancelled').length;
  document.getElementById('scheduledCount').textContent=all.filter(a=>a.status==='scheduled').length;
  document.getElementById('completedCount').textContent=all.filter(a=>a.status==='completed').length;
  document.getElementById('cancelledCount').textContent=all.filter(a=>a.status==='cancelled').length;
  appointmentsEl.innerHTML='';
  emptyEl.hidden=list.length!==0;
  list.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).forEach(a=>{
    const el=document.createElement('article');el.className='appointment';
    el.innerHTML=`
      <div class="appt-main"><div class="paw">🐾</div><div><strong>${escapeHtml(a.dogName)}</strong><small>${escapeHtml(a.service)}</small></div></div>
      <div><div class="field-label">ΗΜΕΡΟΜΗΝΙΑ</div><div class="field-value">${formatDate(a.date)}</div></div>
      <div><div class="field-label">ΩΡΑ</div><div class="field-value">${escapeHtml(a.time)}</div></div>
      <div><div class="field-label">ΕΠΙΚΟΙΝΩΝΙΑ</div><div class="field-value">${escapeHtml(a.phone)}<br>${escapeHtml(a.email||'—')}</div></div>
      <div class="status-wrap"><div class="field-label">ΚΑΤΑΣΤΑΣΗ</div><select class="status-select ${statusClass[a.status]}" data-id="${a.id}"><option value="scheduled" ${a.status==='scheduled'?'selected':''}>🟡 ${statusLabels.scheduled}</option><option value="completed" ${a.status==='completed'?'selected':''}>🟢 ${statusLabels.completed}</option><option value="cancelled" ${a.status==='cancelled'?'selected':''}>🔴 ${statusLabels.cancelled}</option></select><button class="delete-btn" data-delete="${a.id}">Διαγραφή</button></div>`;
    appointmentsEl.appendChild(el)
  })
}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
document.querySelectorAll('.filter').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');render()});
searchEl.oninput=render;
appointmentsEl.addEventListener('change',e=>{
  if(!e.target.matches('.status-select'))return;
  const list=load(),item=list.find(a=>a.id===e.target.dataset.id);if(item){item.status=e.target.value;save(list);render()}
});
appointmentsEl.addEventListener('click',e=>{
  const btn=e.target.closest('[data-delete]');if(!btn)return;
  save(load().filter(a=>a.id!==btn.dataset.delete));render()
});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)render()});
render();