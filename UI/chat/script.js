const chatList = document.getElementById('chatList');
const messages = document.getElementById('messages');
const sendForm = document.getElementById('sendForm');
const text = document.getElementById('text');

const mockChats = [
  {id:'friend-1', name:'Alice'},
  {id:'friend-2', name:'Bob'},
  {id:'group-1', name:'Nhóm Dự án Optimind'},
];
const allMessages = {
  'friend-1': [
    {sender:'Alice', text:'Hey!'},
    {sender:'Me', text:'Chào, đang code trang chat.'}
  ],
  'friend-2': [
    {sender:'Bob', text:'Bạn đã xem tài liệu chưa?'},
  ],
  'group-1': [
    {sender:'Alice', text:'Nhớ push code trước 5h.'},
  ],
};

let currentChat = 'friend-1';

function renderChats(){
  chatList.innerHTML = '';
  mockChats.forEach(c=>{
    const li = document.createElement('li');
    li.textContent = c.name;
    li.onclick = ()=>{ currentChat = c.id; renderMessages(); };
    chatList.appendChild(li);
  })
}

function renderMessages(){
  messages.innerHTML = '';
  (allMessages[currentChat]||[]).forEach(m=>{
    const div = document.createElement('div');
    div.textContent = `${m.sender}: ${m.text}`;
    messages.appendChild(div);
  })
}

sendForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const t = text.value.trim();
  if(!t) return;
  allMessages[currentChat] = allMessages[currentChat]||[];
  allMessages[currentChat].push({sender:'Me', text:t});
  text.value = '';
  renderMessages();
})

renderChats();
renderMessages();