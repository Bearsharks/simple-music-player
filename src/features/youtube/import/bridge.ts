import { EXTENSION_ID, validEnvelope, type ImportEnvelope } from "./contract";
type Runtime = { sendMessage: (id:string,message:unknown,callback:(value:unknown)=>void)=>void; lastError?:{message?:string} };

export function connectImportBridge(receive:(request:ImportEnvelope)=>void, status:(connected:boolean)=>void, seen=new Set<string>()) {
  let stopped=false, running=false, requested=false;
  const send=(message:unknown)=>new Promise<any>((resolve,reject)=>{
    const runtime=(window as unknown as {chrome?:{runtime?:Runtime}}).chrome?.runtime;
    if(!runtime?.sendMessage){reject(Error("확장 프로그램 미연결"));return;}
    let settled=false;
    const timeout=setTimeout(()=>{if(!settled){settled=true;reject(Error("연결 시간 초과"));}},3000);
    try{runtime.sendMessage(EXTENSION_ID,message,value=>{clearTimeout(timeout);if(settled)return;settled=true;runtime.lastError?reject(Error("연결 실패")):resolve(value);});}
    catch(error){clearTimeout(timeout);reject(error);}
  });
  const pull=async()=>{
    if(stopped)return;
    if(running){requested=true;return;}
    running=true;
    try {
      const result=await send({type:"loopy.pull"});if(stopped)return;
      if(!result?.ok)throw Error("연결 실패");
      if(result.request!==null){
        if(!validEnvelope(result.request))throw Error("잘못된 요청");
        if(!seen.has(result.request.requestId)){
          receive(result.request);seen.add(result.request.requestId);
          if(seen.size>256)seen.delete(seen.values().next().value!);
        }
        await send({type:"loopy.ack",requestId:result.request.requestId});
      }
      if(!stopped)status(true);
    }catch{if(!stopped)status(false);}
    finally{running=false;if(requested&&!stopped){requested=false;void pull();}}
  };
  const wake=(event:MessageEvent)=>{
    if(event.source!==window||event.origin!==location.origin||!event.data||typeof event.data!=="object"||
       event.data.type!=="loopy.delivery.available"||Object.keys(event.data).length!==1)return;
    void pull();
  };
  window.addEventListener("message",wake);
  void pull();
  return ()=>{stopped=true;window.removeEventListener("message",wake);};
}
