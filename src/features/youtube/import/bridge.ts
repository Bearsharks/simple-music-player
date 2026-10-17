import { EXTENSION_ID, validEnvelope, type ImportEnvelope } from "./contract";
type Runtime = { sendMessage: (id:string,message:unknown,callback:(value:unknown)=>void)=>void; lastError?:{message?:string} };
export function connectImportBridge(receive:(request:ImportEnvelope)=>void, status:(connected:boolean)=>void, seen=new Set<string>()) {
  let stopped=false, timer:ReturnType<typeof setTimeout>, failures=0;
  const send=(message:unknown)=>new Promise<any>((resolve,reject)=>{
    const runtime=(window as unknown as {chrome?:{runtime?:Runtime}}).chrome?.runtime;
    if(!runtime?.sendMessage){reject(Error("확장 프로그램 미연결"));return;}
    let settled=false; const timeout=setTimeout(()=>{if(!settled){settled=true;reject(Error("연결 시간 초과"));}},3000);
    try{runtime.sendMessage(EXTENSION_ID,message,value=>{clearTimeout(timeout);if(settled)return;settled=true;runtime.lastError?reject(Error("연결 실패")):resolve(value);});}catch(e){clearTimeout(timeout);reject(e);}
  });
  const tick=async()=>{
    try {
      const result=await send({type:"loopy.pull"});if(stopped)return;
      if(!result?.ok)throw Error("연결 실패");status(true);failures=0;
      if(result.request!==null){
        if(!validEnvelope(result.request))throw Error("잘못된 요청");
        if(!seen.has(result.request.requestId)){
          receive(result.request);seen.add(result.request.requestId);
          if(seen.size>256)seen.delete(seen.values().next().value!);
        }
        await send({type:"loopy.ack",requestId:result.request.requestId});
      }
    }catch{if(!stopped){status(false);failures++;}}
    if(!stopped)timer=setTimeout(tick,failures?5000:1500);
  };
  void tick();return ()=>{stopped=true;clearTimeout(timer);};
}
