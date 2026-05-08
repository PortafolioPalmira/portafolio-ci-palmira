const CSV_PATH = 'portafolio_proyectos.csv';
const COL = {
  programa:'Programa estratégico', sistema:'Sistema productivo', area:'Área temática', proyecto:'Nombre del proyecto', lider:'Investigador líder', rol:'Rol CI Palmira', ejecutora:'Institución ejecutora', aliados:'Aliados estratégicos', problema:'Problema abordado', objetivo:'Objetivo del proyecto', justificacion:'Justificación estratégica', politica:'Política pública asociada', metodologia:'Metodología principal', variables:'Variables evaluadas', intervencion:'Tipo de intervención (I+D+i, Canales OT, Fortalecimiento)', resultados:'Resultados principales', productos:'Productos generados', publicaciones:'Publicaciones', oferta:'Oferta tecnológica', tecnologia:'Tipo de tecnología', trlInicial:'TRL inicial', trlFinal:'TRL final', estadoTecnologico:'Estado tecnológico', impactoTecnico:'Impacto técnico', impactoEconomico:'Impacto económico', impactoSocial:'Impacto social', impactoAmbiental:'Impacto ambiental', departamentos:'Departamentos', municipios:'Municipios', beneficiarios:'Tipo de beneficiarios', directos:'Beneficiarios directos', indirectos:'Beneficiarios indirectos', adopcion:'Área potenciales de adopción', activos:'Activos generados', pi:'Estado propiedad intelectual', financiador:'Financiador', monto:'Monto del proyecto', inicio:'Año inicio', final:'Año final', estado:'Estado del proyecto', emergente:'Capacidad_emergente', consolidada:'Capacidad_consolidada', distintiva:'Capacidad_distintiva'
};
let projects = [], filtered = [];
const $ = id => document.getElementById(id);

function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"' && q && n==='"'){ cell+='"'; i++; }
    else if(c==='"'){ q=!q; }
    else if(c===',' && !q){ row.push(cell); cell=''; }
    else if((c==='\n'||c==='\r') && !q){ if(c==='\r'&&n==='\n') i++; row.push(cell); if(row.some(x=>x.trim())) rows.push(row); row=[]; cell=''; }
    else cell+=c;
  }
  if(cell||row.length){ row.push(cell); if(row.some(x=>x.trim())) rows.push(row); }
  const headers=rows.shift().map(h=>h.replace(/^\uFEFF/,'').trim());
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()]))).filter(d=>d[COL.proyecto]);
}
function unique(col){return [...new Set(projects.map(p=>p[col]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));}
function fillSelect(id,col){ const el=$(id); unique(col).forEach(v=>el.add(new Option(v,v))); }
function countBy(data,col){ return data.reduce((a,p)=>{const v=p[col]||'Sin clasificar'; a[v]=(a[v]||0)+1; return a;},{}); }
function topEntries(obj,limit=8){return Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,limit);}
function renderBars(id,obj){
  const entries=topEntries(obj); const max=Math.max(...entries.map(e=>e[1]),1);
  $(id).innerHTML=entries.map(([label,value])=>`<div class="bar-row"><span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span><span class="bar-track"><span class="bar-fill" style="width:${(value/max)*100}%"></span></span><b>${value}</b></div>`).join('') || '<p class="muted">Sin datos</p>';
}
function escapeHtml(str=''){return str.replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function short(str='',n=180){ return str.length>n ? str.slice(0,n).trim()+'…' : str; }
function moneyValues(){ return projects.map(p => Number((p[COL.monto]||'').replace(/[^0-9.-]/g,''))).filter(n=>!Number.isNaN(n)&&n>0); }
function applyFilters(){
  const q=$('searchInput').value.toLowerCase(), program=$('programFilter').value, system=$('systemFilter').value, area=$('areaFilter').value, status=$('statusFilter').value;
  filtered=projects.filter(p => (!program||p[COL.programa]===program) && (!system||p[COL.sistema]===system) && (!area||p[COL.area]===area) && (!status||p[COL.estado]===status) && (!q || Object.values(p).join(' ').toLowerCase().includes(q)) );
  renderAll();
}
function renderKPIs(){
  const systems=new Set(filtered.map(p=>p[COL.sistema]).filter(Boolean)).size;
  const areas=new Set(filtered.map(p=>p[COL.area]).filter(Boolean)).size;
  const leaders=new Set(filtered.map(p=>p[COL.lider]).filter(Boolean)).size;
  $('kpis').innerHTML=[['Proyectos',filtered.length],['Sistemas productivos',systems],['Áreas temáticas',areas],['Investigadores líderes',leaders]].map(k=>`<article class="kpi"><span>${k[0]}</span><strong>${k[1]}</strong></article>`).join('');
}
function renderProjects(){
  $('resultCount').textContent=`${filtered.length} registros encontrados`;
  $('projectGrid').innerHTML=filtered.map((p,i)=>`<article class="project-card"><div class="tags"><span class="tag">${escapeHtml(p[COL.sistema]||'Sistema s/d')}</span><span class="tag">${escapeHtml(p[COL.estado]||'Estado s/d')}</span></div><h3>${escapeHtml(p[COL.proyecto])}</h3><p>${escapeHtml(short(p[COL.objetivo]||p[COL.resultados]||p[COL.problema]||'Sin resumen disponible.'))}</p><div class="meta"><span><b>Área:</b> ${escapeHtml(p[COL.area]||'')}</span><span><b>Líder:</b> ${escapeHtml(p[COL.lider]||'No reportado')}</span><span><b>Periodo:</b> ${escapeHtml(p[COL.inicio]||'')} – ${escapeHtml(p[COL.final]||'')}</span></div><button class="open-btn" onclick="openProject(${projects.indexOf(p)})">Ver ficha</button></article>`).join('') || '<p>No hay proyectos con estos filtros.</p>';
}
function renderCharts(){ renderBars('chartSystems',countBy(filtered,COL.sistema)); renderBars('chartAreas',countBy(filtered,COL.area)); renderBars('chartStatus',countBy(filtered,COL.estado)); }
function renderAll(){ renderKPIs(); renderCharts(); renderProjects(); }
function field(label,value,full=false){ if(!value) return ''; return `<div class="field ${full?'full':''}"><b>${label}</b><span>${escapeHtml(value)}</span></div>`; }
function openProject(index){
  const p=projects[index]; if(!p) return;
  $('modalArea').textContent=[p[COL.sistema],p[COL.area]].filter(Boolean).join(' · ');
  $('modalTitle').textContent=p[COL.proyecto];
  $('modalBody').innerHTML=[field('Investigador líder',p[COL.lider]),field('Programa estratégico',p[COL.programa]),field('Rol C.I. Palmira',p[COL.rol]),field('Institución ejecutora',p[COL.ejecutora]),field('Aliados estratégicos',p[COL.aliados],true),field('Problema abordado',p[COL.problema],true),field('Objetivo',p[COL.objetivo],true),field('Justificación estratégica',p[COL.justificacion],true),field('Metodología principal',p[COL.metodologia],true),field('Variables evaluadas',p[COL.variables],true),field('Resultados principales',p[COL.resultados],true),field('Productos generados',p[COL.productos],true),field('Oferta tecnológica',p[COL.oferta]),field('Tipo de tecnología',p[COL.tecnologia]),field('TRL inicial / final',[p[COL.trlInicial],p[COL.trlFinal]].filter(Boolean).join(' / ')),field('Estado tecnológico',p[COL.estadoTecnologico]),field('Impacto técnico',p[COL.impactoTecnico],true),field('Impacto económico',p[COL.impactoEconomico],true),field('Impacto social',p[COL.impactoSocial],true),field('Impacto ambiental',p[COL.impactoAmbiental],true),field('Departamentos',p[COL.departamentos]),field('Municipios',p[COL.municipios]),field('Beneficiarios',p[COL.beneficiarios]),field('Financiador',p[COL.financiador]),field('Monto del proyecto',p[COL.monto]),field('Estado del proyecto',p[COL.estado]),field('Política pública asociada',p[COL.politica],true),field('Activos generados',p[COL.activos],true),field('Estado propiedad intelectual',p[COL.pi],true)].join('');
  $('projectModal').showModal();
}
window.openProject=openProject;
async function init(){
  const res=await fetch(CSV_PATH); const text=await res.text(); projects=parseCSV(text); filtered=[...projects];
  fillSelect('programFilter',COL.programa); fillSelect('systemFilter',COL.sistema); fillSelect('areaFilter',COL.area); fillSelect('statusFilter',COL.estado);
  ['searchInput','programFilter','systemFilter','areaFilter','statusFilter'].forEach(id=>$(id).addEventListener('input',applyFilters));
  $('resetFilters').addEventListener('click',()=>{['searchInput','programFilter','systemFilter','areaFilter','statusFilter'].forEach(id=>$(id).value=''); applyFilters();});
  $('closeModal').addEventListener('click',()=>$('projectModal').close());
  renderAll();
}
init().catch(err=>{document.body.insertAdjacentHTML('afterbegin',`<div class="error">No se pudo cargar el CSV: ${escapeHtml(err.message)}</div>`);});
