'use strict';
const el=id=>document.getElementById(id),show=(id,on=true)=>el(id).classList.toggle('hide',!on);
const chapters=[
['Research topic and outline','Week 1','One-page research topic outline for lecturer approval.','Identify a business or financial management problem, motivate its relevance and define the initial research direction.','Which evidence proves the practical problem is significant?'],
['Introduction and literature review','Week 2','Introduction, literature review and theoretical framework.','Develop the problem statement, objectives and research question; critically compare literature and identify a research gap.','Where do studies agree or disagree, and what gap does this project address?'],
['Methodology and data plan','Week 3','Research design, data collection, analysis, ethics and limitations.','Justify the research design, data sources, sampling, analytical methods and measures of quality.','Why does this method answer the research question credibly?'],
['Analysis, findings and discussion','Weeks 4–5','Evidence-based findings and discussion linked to academic literature.','Analyse the evidence, interpret findings, compare literature and discuss implications.','What finding most directly answers your research question?'],
['Integrated report and presentation','Week 6','Integrated group paper, conclusions, recommendations and presentation.','Combine research chapters into a coherent paper and prepare the final presentation and Q&A.','Are your recommendations directly supported by findings?']];
let user=null,groups=[],selected=null,detail=null,step=1,timer=null;
function toast(s){const x=el('toast');x.textContent=s;x.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>x.style.display='none',5000)}
async function api(url,method='GET',data){const r=await fetch('/api'+url,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:method==='GET'?undefined:JSON.stringify(data||{})});let out={};try{out=await r.json()}catch{}if(!r.ok)throw Error(out.error||'Request failed');return out}
async function act(fn){try{await fn()}catch(e){toast(e.message)}}
function formdata(f){return Object.fromEntries(new FormData(f).entries())}
function authPage(v){['login','register','setup'].forEach(x=>show(x+'Form',x===v));document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('selected',x.dataset.view===v));el('authError').textContent=''}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>authPage(b.dataset.view)));
['login','register','setup'].forEach(name=>el(name+'Form').addEventListener('submit',e=>{e.preventDefault();act(async()=>{const data=await api('/'+name,'POST',formdata(e.target));user=data.user;e.target.reset();await enter()})}));
el('logout').addEventListener('click',()=>act(async()=>{if(user.role==='student')await saveDraft();await api('/logout','POST');location.reload()}));
async function boot(){try{const r=await api('/me');user=r.user;await enter()}catch{const cfg=await api('/config');show('setupTab',!cfg.initialized);authPage(cfg.initialized?'login':'setup')}}
async function enter(){show('auth',false);show('app');show('logout');el('who').textContent=user.full_name+' · '+user.role;show('studentView',user.role==='student');show('teacherView',user.role==='lecturer');el('sideLabel').textContent=user.role==='lecturer'?'LECTURER WORKSPACE':'YOUR RESEARCH GROUP';await refresh();if(user.role==='student')await loadCoachStatus()}
async function refresh(){const d=await api('/groups');groups=d.groups;selected=groups.find(x=>x.id===selected?.id)||groups[0];el('sideTitle').textContent=user.role==='lecturer'?'Classes and groups':(selected?.name||'My group');el('sideDetail').textContent=user.role==='lecturer'?(groups.length+' research groups'):(selected?.class_name||'');nav();if(user.role==='lecturer')await dashboard();else if(selected)await openGroup(selected.id)}
function nav(){const box=el('groupNavigation');box.replaceChildren();if(user.role==='student'){chapters.forEach((c,i)=>{const b=document.createElement('button');b.className='navBtn'+(i+1===step?' active':'');b.textContent=(i+1)+'. '+c[0];const s=document.createElement('small');s.textContent=c[1];b.append(s);b.onclick=async()=>{if(!await saveDraft())return;step=i+1;student();nav()};box.append(b)})}else{for(const cl of [...new Set(groups.map(g=>g.class_name))]){const title=document.createElement('p');title.className='eyebrow';title.textContent=cl;box.append(title);groups.filter(g=>g.class_name===cl).forEach(g=>{const b=document.createElement('button');b.className='navBtn'+(selected?.id===g.id?' active':'');b.textContent=g.name;const small=document.createElement('small');small.textContent=g.submitted_count+'/5 submitted';b.append(small);b.onclick=()=>choose(g.id);box.append(b)})}}}
async function openGroup(id){detail=await api('/groups/'+id);if(user.role==='student')student();else review()}
function milestone(n){return detail.milestones.find(m=>m.step===n)||{step:n,draft:'',submitted:false,feedback:'',review:'not-reviewed',revision:0}}
function student(){if(!detail)return;const c=chapters[step-1],m=milestone(step);el('studentTitle').textContent=step+'. '+c[0];el('studentSubtitle').textContent=detail.group.class_name+' · '+detail.group.name+' · '+c[1];el('milestoneOutput').textContent='What you will hand in: '+c[2];el('milestoneDescription').textContent=c[3];el('milestoneQuestion').textContent='Guiding question: '+c[4];el('draft').value=m.draft;el('studentTopic').value=detail.group.topic;el('saveStatus').textContent='Saved online';el('submissionStatus').textContent=m.submitted?'Submitted':'Not submitted';el('submitMilestone').textContent=m.submitted?'Update submission':'Submit milestone';el('submitMilestone').disabled=step>1&&detail.group.approval!=='approved';show('feedbackBox',!!m.feedback);el('feedbackText').textContent=m.feedback||'';el('reviewState').textContent='Review: '+m.review;nav()}
async function saveDraft(submit=false){if(user?.role!=='student'||!detail)return true;clearTimeout(timer);const m=milestone(step),draft=el('draft').value;if(!submit&&m.draft===draft)return true;if(submit&&!draft.trim()){toast('Write a draft before submitting');return false}try{el('saveStatus').textContent='Saving...';const r=await api('/groups/'+selected.id+'/milestones/'+step,'PATCH',{draft,submitted:submit||m.submitted,revision:m.revision});detail.milestones=detail.milestones.filter(x=>x.step!==step).concat(r.milestone);el('saveStatus').textContent='Saved online';el('submissionStatus').textContent=r.milestone.submitted?'Submitted':'Not submitted';if(submit)toast('Milestone synchronized with lecturer');return true}catch(e){el('saveStatus').textContent='Save failed';toast(e.message);return false}}
el('draft').addEventListener('input',()=>{clearTimeout(timer);el('saveStatus').textContent='Unsaved changes';timer=setTimeout(()=>saveDraft(),1400)});
el('saveDraft').onclick=()=>saveDraft();el('submitMilestone').onclick=()=>act(async()=>{if(await saveDraft(true))await refresh()});
el('saveTopic').onclick=()=>act(async()=>{if(!await saveDraft())return;await api('/groups/'+selected.id,'PATCH',{topic:el('studentTopic').value});toast('Topic synchronized');await refresh()});
async function dashboard(){const d=await api('/classes'),filter=el('classFilter'),old=filter.value;filter.replaceChildren(new Option('All classes','all'));d.classes.forEach(c=>filter.add(new Option(c.name,c.id)));if([...filter.options].some(o=>o.value===old))filter.value=old;el('metricGroups').textContent=groups.length;el('metricSubmissions').textContent=groups.reduce((sum,g)=>sum+g.submitted_count,0);el('metricApproved').textContent=groups.filter(g=>g.approval==='approved').length;table();if(selected)await openGroup(selected.id);nav()}
function table(){const box=el('groupRows');box.replaceChildren();groups.filter(g=>el('classFilter').value==='all'||String(g.class_id)===el('classFilter').value).forEach(g=>{const tr=document.createElement('tr');if(g.id===selected?.id)tr.className='chosen';[g.class_name,g.name,g.approval,g.submitted_count+'/5'].forEach(x=>{const td=document.createElement('td');td.textContent=x;tr.append(td)});const td=document.createElement('td'),b=document.createElement('button');b.textContent='Review';b.onclick=()=>choose(g.id);td.append(b);tr.append(td);box.append(tr)})}
async function choose(gid){selected=groups.find(g=>g.id===gid);await openGroup(gid);nav();table()}
function review(){const g=detail.group;el('reviewTitle').textContent=g.class_name+' · '+g.name;el('reviewTopic').value=g.topic;el('reviewApproval').value=g.approval;el('groupMembers').textContent='Registered students: '+(detail.members.map(x=>x.full_name).join(', ')||'none yet');const select=el('reviewStep'),old=select.value;select.replaceChildren();chapters.forEach((c,i)=>select.add(new Option((i+1)+'. '+c[0],String(i+1))));select.value=old||'1';reviewStep()}
function reviewStep(){const m=milestone(Number(el('reviewStep').value)||1);el('reviewDraft').value=m.draft;el('reviewStatus').value=m.review;el('reviewFeedback').value=m.feedback;el('reviewSubmissionState').textContent=m.submitted?'Submitted · last updated '+new Date(m.updated_at).toLocaleString():'Not yet submitted'}
el('reviewStep').onchange=reviewStep;el('classFilter').onchange=table;
el('saveGroupReview').onclick=()=>act(async()=>{await api('/groups/'+selected.id,'PATCH',{topic:el('reviewTopic').value,approval:el('reviewApproval').value});toast('Topic approval saved');await refresh()});
el('saveReview').onclick=()=>act(async()=>{const n=Number(el('reviewStep').value),m=milestone(n);await api('/groups/'+selected.id+'/milestones/'+n,'PATCH',{draft:m.draft,submitted:m.submitted,revision:m.revision,review:el('reviewStatus').value,feedback:el('reviewFeedback').value});toast('Feedback synchronized with students');await refresh()});
el('inviteButton').onclick=()=>act(async()=>{if(!confirm('Generate a new group invitation? Existing invitation codes for this group will stop working.'))return;const r=await api('/groups/'+selected.id+'/invite','POST');const box=el('inviteResult');box.replaceChildren();const label=document.createElement('p');label.textContent='One-time display · Share this code only with members of this group:';const code=document.createElement('code');code.textContent=r.inviteCode;code.style.overflowWrap='anywhere';box.append(label,code);show('inviteResult');toast('Copy this invitation code now')});
el('newClass').onclick=()=>act(async()=>{const name=prompt('New class name:');if(!name)return;const n=prompt('Number of groups (1–50):','6');if(!n)return;await api('/classes','POST',{name,groups:Number(n)});toast('Class created');await refresh()});
el('newGroup').onclick=()=>act(async()=>{const cl=el('classFilter').value,cls=cl==='all'?[...el('classFilter').options].find(o=>o.value!=='all')?.value:cl;if(!cls){toast('Create a class first');return}const name=prompt('New group name:','Group '+(groups.length+1));if(!name)return;await api('/groups','POST',{classId:Number(cls),name});toast('Group created');await refresh()});
el('exportCsv').onclick=()=>act(async()=>{const r=await api('/export'),cols=['class_name','group_name','topic','approval','step','submitted','review','feedback'];const csv=[cols.join(',')].concat(r.rows.map(x=>cols.map(k=>'"'+String(x[k]??'').replaceAll('"','""')+'"').join(','))).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ResearchLab_progress.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)});
let coachReady=false;
async function loadCoachStatus(){
  try{
    const status=await api('/coach/status');
    coachReady=status.enabled===true;
    el('coachBadge').textContent=coachReady?'Available':'Not configured';
    el('coachAvailability').textContent=coachReady
      ?'AI is available for limited research guidance. Only text you explicitly submit will be shared with the AI provider; do not include personal information, confidential company records, or identifiable student data.'
      :'AI is not yet activated by the lecturer. The research questions and drafting tools above still work normally.';
    el('askCoach').disabled=!coachReady;
    el('coachStatus').textContent=coachReady?'Up to 12 AI questions per day per student.':'No AI questions can be sent until activated.';
  }catch(e){
    coachReady=false;
    el('coachBadge').textContent='Unavailable';
    el('coachAvailability').textContent='The AI coach is currently unavailable. You can continue your research work.';
    el('askCoach').disabled=true;
  }
}
el('askCoach').onclick=async()=>{
  if(!coachReady)return;
  if(!el('coachConsent').checked){toast('Please read and accept the privacy notice first.');return}
  const question=el('coachQuestion').value.trim(),mode=el('coachMode').value;
  if(question.length<10||question.length>1200){toast('Enter a question between 10 and 1200 characters.');return}
  const button=el('askCoach');
  button.disabled=true;
  el('coachStatus').textContent='Thinking...';
  show('coachAnswerBox',false);
  try{
    const r=await api('/coach/ask','POST',{question,mode,step,consent:true});
    el('coachAnswer').textContent=r.reply;
    show('coachAnswerBox');
    el('coachStatus').textContent='You have '+r.remainingToday+' AI questions remaining today.';
  }catch(e){
    el('coachStatus').textContent='AI request failed. Your draft was not affected.';
    toast(e.message);
  }finally{
    button.disabled=!coachReady;
  }
};

boot().catch(e=>toast('Server unavailable: '+e.message));