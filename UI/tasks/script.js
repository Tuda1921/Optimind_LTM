const initialTasks={
  todo:[
    {id:'1',title:'Hoàn thiện UI',description:'Cập nhật giao diện',tags:['UI'],priority:'high'},
    {id:'2',title:'Nghiên cứu WebRTC',tags:['Research'],priority:'medium'}
  ],
  onProgress:[{id:'3',title:'Code Pomodoro',tags:['Dev','React'],priority:'high'}],
  complete:[{id:'4',title:'Thiết kế CSDL',tags:['DB','Supabase'],priority:'low'}],
  overdue:[{id:'5',title:'Nộp báo cáo tuần 1',priority:'high'}]
};
function renderColumn(id){
  const list=document.getElementById(id);
  list.innerHTML='';
  (initialTasks[id]||[]).forEach(t=>{
    const div=document.createElement('div');
    div.className='task';
    div.innerHTML=`<strong>${t.title}</strong><p>${t.description||''}</p>`;
    const tags=document.createElement('div');
    (t.tags||[]).forEach(tag=>{const s=document.createElement('span');s.className='tag';s.textContent=tag;tags.appendChild(s);});
    div.appendChild(tags);
    list.appendChild(div);
  })
}
['todo','onProgress','complete','overdue'].forEach(renderColumn);