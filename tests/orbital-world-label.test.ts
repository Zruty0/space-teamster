import { drawOrbitalWorldLabel } from '../src/orbital-world-label';
let checks=0;
function assert(ok:unknown,message:string):asserts ok{checks++;if(!ok)throw Error(message);}
for(const id of ['estella-ii','estella-iv','estella-v','estella-vi','estella-iii','estella-iiia','estella-x','unknown']){
 const calls:any[]=[],stack:any[]=[];
 const state={strokeStyle:'#f00',lineWidth:8,lineJoin:'bevel',dash:[4,6],fillStyle:'#00ffcc',font:'bold 10px monospace',textAlign:'right',textBaseline:'middle'};
 const raw:any={...state,
  save(){stack.push({...this,dash:[...this.dash]});},restore(){Object.assign(this,stack.pop());},
  setLineDash(dash:number[]){this.dash=dash;},
  strokeText(...args:unknown[]){calls.push({kind:'outline',args,color:this.strokeStyle,width:this.lineWidth,join:this.lineJoin,dash:this.dash});},
  fillText(...args:unknown[]){calls.push({kind:'fill',args,color:this.fillStyle,font:this.font});},
 };
 const before=JSON.stringify(raw);drawOrbitalWorldLabel(raw,id,'LONG ACTUAL DESTINATION',137,289);
 assert(JSON.stringify(raw)===before&&!stack.length,'halo restores caller canvas state');
 assert(JSON.stringify(calls[calls.length-1].args)===JSON.stringify(['LONG ACTUAL DESTINATION',137,289]),'same full text/anchor, no truncation');
 assert(calls[calls.length-1].color===state.fillStyle&&calls[calls.length-1].font===state.font,'target colour and font retained');
 if(id==='estella-ii'||id==='estella-iv'||id==='estella-v'||id==='estella-vi'){
  assert(calls.length===2&&calls[0].kind==='outline'&&calls[1].kind==='fill','halo behind text');
  assert(calls[0].color==='#071019'&&calls[0].width===3&&calls[0].join==='round'&&!calls[0].dash.length,'opaque smooth undashed dark halo');
  assert(JSON.stringify(calls[0].args)===JSON.stringify(calls[1].args),'outline shares exact glyph coordinates');
 }else assert(calls.length===1,'other world labels remain unchanged pending review');
}
console.log(`Orbital world label contrast passed: ${checks} assertions.`);
