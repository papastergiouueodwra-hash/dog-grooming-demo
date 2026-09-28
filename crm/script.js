const statusLabels={scheduled:'Προγραμματισμένο',completed:'Ολοκληρώθηκε',cancelled:'Ακυρώθηκε'};
const statusClass={scheduled:'scheduled',completed:'completed',cancelled:'cancelled'};
const appointmentsEl=document.getElementById('appointments');
const emptyEl=document.getElementById('empty');
const searchEl=document.getElementById('search');
let appointments=[];

const today=new Date();
document.getElementById('todayLabel').textContent=today.toLocaleDateString('el-GR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase();

async function loadAppointments(){
  const response=await fetch('/api/appointments');
  if(!response.ok)throw new Error('Failed to load appointments');
  appointments=await response.json();
  render();
}

function formatDate(value){
  if(!value)return '—';
  return new Date(value+'T12:00:00').toLocaleDateString('el-GR',{day:'2-digit',month:'2-digit',year:'numeric'})
}

function render(){
  const active=document.querySelector('.filter.active')?.dataset.filter||'all';
  const query=searchEl.value.trim().toLowerCase();
  const all=appointments;
  const list=all.filter(a=>(active==='all'||a.status===active)&&(!query||a.dogName.toLowerCase().includes(query)||(a.phone||'').includes(query)||(a.email||'').toLowerCase().includes(query)));
  const todayKey=new Date().toISOString().slice(0,10);
  document.getElementById('todayCount').textContent=all.filter(a=>a.date===todayKey&&a.status!=='cancelled').length;
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
      <div><div class="field-label">ΕΠΙΚΟΙΝΩΝΙΑ</div><div class="field-value">${escapeHtml(a.phone||'—')}<br>${escapeHtml(a.email||'—')}</div></div>
      <div class="status-wrap"><div class="field-label">ΚΑΤΑΣΤΑΣΗ</div><select class="status-select ${statusClass[a.status]}" data-id="${a.id}"><option value="scheduled" ${a.status==='scheduled'?'selected':''}>🟡 ${statusLabels.scheduled}</option><option value="completed" ${a.status==='completed'?'selected':''}>🟢 ${statusLabels.completed}</option><option value="cancelled" ${a.status==='cancelled'?'selected':''}>🔴 ${statusLabels.cancelled}</option></select><button class="delete-btn" data-delete="${a.id}">Διαγραφή</button></div>`;
    appointmentsEl.appendChild(el)
  })
}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

document.querySelectorAll('.filter').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');render()});
searchEl.oninput=render;

appointmentsEl.addEventListener('change',async e=>{
  if(!e.target.matches('.status-select'))return;
  const id=e.target.dataset.id;
  const status=e.target.value;
  e.target.disabled=true;
  try{
    const response=await fetch('/api/appointments',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});
    if(!response.ok)throw new Error('Status update failed');
    const updated=await response.json();
    const item=appointments.find(a=>a.id===id);
    if(item)item.status=updated.status;
    render();
  }catch(error){
    alert('Δεν ήταν δυνατή η αλλαγή της κατάστασης.');
    render();
  }
});

appointmentsEl.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-delete]');if(!btn)return;
  if(!confirm('Να διαγραφεί αυτό το ραντεβού;'))return;
  btn.disabled=true;
  try{
    const response=await fetch('/api/appointments?id='+encodeURIComponent(btn.dataset.delete),{method:'DELETE'});
    if(!response.ok)throw new Error('Delete failed');
    appointments=appointments.filter(a=>a.id!==btn.dataset.delete);
    render();
  }catch(error){
    alert('Δεν ήταν δυνατή η διαγραφή του ραντεβού.');
    render();
  }
});

loadAppointments().catch(()=>{
  appointmentsEl.innerHTML='<div class="empty"><div>⚠️</div><h2>Δεν ήταν δυνατή η σύνδεση</h2><p>Έλεγξε τη σύνδεση της Neon και ξαναφόρτωσε τη σελίδα.</p></div>';
});
