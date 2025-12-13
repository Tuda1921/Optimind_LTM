const rooms=[
  {id:'r1',name:'Phòng Study 1',host:'Alice',participants:2,max:8},
  {id:'r2',name:'Phòng Battle 1',host:'Bob',participants:4,max:8},
];
const list=document.getElementById('roomList');
rooms.forEach(r=>{const li=document.createElement('li');li.textContent=`${r.name} • Chủ: ${r.host} • ${r.participants}/${r.max}`;list.appendChild(li);});