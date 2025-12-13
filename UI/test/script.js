const status=document.getElementById('status');
const video=document.getElementById('video');
const canvas=document.getElementById('canvas');
const output=document.getElementById('output');
const INPUT_H=224,INPUT_W=224,SEQUENCE_LENGTH=30;
const CLASS_LABELS=['Boredom','Engagement','Confusion','Frustration'];

let session=null;
let frameQueue=[];

async function loadModel(){
  try{
    ort.env.wasm.numThreads=1;
    session=await ort.InferenceSession.create('/best_engagement_model.onnx',{executionProviders:['wasm'],freeDimensionOverrides:{batch_size:1}});
    status.textContent='✅ Tải mô hình ONNX thành công. Đang chờ camera...';
    await startCamera();
  }catch(e){
    status.textContent='LỖI: Không tải được mô hình. '+e.message;
  }
}

async function startCamera(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480}});
    video.srcObject=stream;
    video.onloadeddata=()=>{requestAnimationFrame(loop)};
  }catch(e){
    status.textContent='LỖI: Không truy cập được camera. Vui lòng cấp quyền.';
  }
}

function normalizeFrame(){
  const ctx=canvas.getContext('2d');
  if(!ctx||video.paused||video.ended)return null;
  ctx.drawImage(video,0,0,INPUT_W,INPUT_H);
  const imageData=ctx.getImageData(0,0,INPUT_W,INPUT_H);
  const {data}=imageData;const floatData=new Float32Array(INPUT_H*INPUT_W*3);
  for(let i=0;i<INPUT_H*INPUT_W;i++){
    const r=data[i*4]/255,g=data[i*4+1]/255,b=data[i*4+2]/255;
    // ImageNet normalize
    const R=(r-0.485)/0.229,G=(g-0.456)/0.224,B=(b-0.406)/0.225;
    floatData[i*3]=R;floatData[i*3+1]=G;floatData[i*3+2]=B;
  }
  return floatData;
}

async function runInference(){
  if(!session||frameQueue.length<SEQUENCE_LENGTH)return;
  const input=new ort.Tensor('float32',concatFrames(frameQueue),[1,SEQUENCE_LENGTH,3,INPUT_H,INPUT_W]);
  const feeds={input_frames:input};
  const results=await session.run(feeds);
  const outputTensor=results.output_scores;
  const arr=outputTensor.data;
  const probs=softmax(arr);
  const bestIdx=probs.indexOf(Math.max(...probs));
  const summary={label:CLASS_LABELS[bestIdx],probabilities:CLASS_LABELS.map((l,i)=>({label:l,percentage:(probs[i]*100).toFixed(1)+'%'}))};
  output.textContent=JSON.stringify(summary,null,2);
}

function softmax(arr){const ex=arr.map(v=>Math.exp(v));const sum=ex.reduce((a,b)=>a+b,0);return ex.map(v=>v/sum);} 
function concatFrames(frames){const total=SEQUENCE_LENGTH*INPUT_H*INPUT_W*3;const out=new Float32Array(total);let offset=0;for(let i=0;i<SEQUENCE_LENGTH;i++){out.set(frames[i],offset);offset+=INPUT_H*INPUT_W*3;}return out;}

function loop(){
  const f=normalizeFrame();
  if(f){frameQueue.push(f);if(frameQueue.length>SEQUENCE_LENGTH)frameQueue.shift();}
  runInference();
  requestAnimationFrame(loop);
}

loadModel();