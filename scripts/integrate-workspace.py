from pathlib import Path
p=Path('src/workspace.tsx');s=p.read_text()
s=s.replace('import { useEffect, useRef, useState, type ReactNode }','import { lazy, Suspense, useEffect, useRef, useState, type ReactNode }')
s=s.replace('import { useCalls } from "./useCalls";', '''import { useCalls } from "./useCalls";
import {useRemote, useWorkspace, post} from './workspaceState';
import {ResponsiveContainer, BarChart, Bar, XAxis, Tooltip} from 'recharts';
import verifiedCall from './verifiedCall.json';
const AgentPanel=lazy(()=>import('./AgentPanel'));
type AgentRole='avani'|'asm'|'coach'|'followup'|'telecaller';''')
start=s.index('function stored<T>');end=s.index('function Avatar',start);s=s[:start]+s[end:]
s=s.replace('const [messages, setMessages] = useLocal<Record<string, Message[]>>(\n      "og-messages-v1",\n      {},\n    ),\n    [responses, setResponses] = useLocal<Record<string, string>>(\n      "og-responses-v1",\n      {},\n    ),\n    [followups, setFollowups] = useLocal<Followup[]>("og-followups-v1", []);','''const [messages, setMessages] = useRemote('messages'),
 [responses,setResponses]=useRemote('responses'),
 [followups,setFollowups]=useRemote('followups');
 const remote=useWorkspace();
 const [agentOpen,setAgentOpen]=useState<AgentRole|null>(null),[demoPhone,setDemoPhone]=useState(''),[demoConsent,setDemoConsent]=useState(false);''')
s=s.replace('function saveFollowup() {','async function saveFollowup() {').replace('function savePreparedRequest(call: Call) {','async function savePreparedRequest(call: Call) {').replace('function sendMessage() {','async function sendMessage() {').replace('function answer(text: string) {','async function answer(text: string) {')
s=s.replace('    setFollowups((rows)', '    await setFollowups((rows)').replace('    setMessages((all)', '    await setMessages((all)').replace('    setResponses((v)', '    await setResponses((v)')
s=s.replace('Team conversation · local demo','Team conversation · your demo workspace')
s=s.replace('Saves a local callback request. Store confirmation is still\n              needed; no call or invitation is sent.','Saves this callback in your private demo workspace. Use the Follow-up agent to schedule an AI call; store confirmation remains separate.')
s=s.replace('onClick={() => setChannel("daily-brief")}','onClick={() => setAgentOpen("avani")}').replace('View daily brief <ArrowRight','Ask Avani <ArrowRight')
s=s.replace('                      name: "Walk-out recovery",','                      role: "recovery",\n                      name: "Walk-out recovery",').replace('                      name: "Pitch coach",','                      role: "coach",\n                      name: "Pitch coach",').replace('                      name: "Follow-up agent",','                      role: "followup",\n                      name: "Follow-up agent",')
s=s.replace('                  ]\n                    .filter((a)', '''                    {role:'asm',name:'ASM Agent',desc:'Turn callback promises and open questions into a priority plan',icon:BarChart3},
                    {role:'telecaller',name:'Tele-caller',desc:'Speak from your browser, then capture the outcome',icon:Phone},
                  ]
                    .filter((a)''')
start=s.index('                        onClick={() =>\n                          setChannel(a.name')
end=s.index('                      >',start)
s=s[:start]+'''                        onClick={() => a.role==='recovery'?setCallOpen(true):setAgentOpen(a.role as AgentRole)}
'''+s[end:]
# Use a chart library while retaining restrained chart card and sample labels.
start=s.index('        <div className="og-bars">');end=s.index('      </section>',start)
s=s[:start]+'''        <div style={{height:180,width:'100%'}} role="img" aria-label={`${title}, seven day sample: ${values.join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={values.map((value,i)=>({day:['Mon','Tue','Wed','Thu','Fri','Sat','Today'][i],value}))} margin={{top:20,right:8,bottom:0,left:8}}><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#6e7975'}}/><Tooltip formatter={(value)=>`${value}${suffix}`} cursor={{fill:'#f2f5f3'}}/><Bar dataKey="value" fill={color} radius={[4,4,0,0]} maxBarSize={28}/></BarChart></ResponsiveContainer>
        </div>
'''+s[end:]
# Destination only requested at the point of calling.
s=s.replace('<span>Authorized test phone</span>\n                <strong>{voice.config?.recipient || "Not configured"}</strong>', '''<label style={{width:'100%'}}>Your demo phone<input aria-label="Your demo phone" type="tel" placeholder="+91 mobile number" value={demoPhone} onChange={e=>setDemoPhone(e.target.value)}/></label>''')
s=s.replace('              <button\n                className="og-primary"\n                onClick={() => void voice.start()}', '''              <label className="og-consent"><input type="checkbox" checked={demoConsent} onChange={e=>setDemoConsent(e.target.checked)}/>This is my number and I agree to a short AI demo call.</label>
              <button
                className="og-primary"
                onClick={() => void voice.start({phone:demoPhone,consent:demoConsent,leadId:'mukunda'})}''')
s=s.replace('                  !voice.config?.ready ||','                  !demoConsent || !demoPhone.trim() || !voice.config?.ready ||')
s=s.replace('Call my test phone','Call my phone')
s=s.replace('This calls your authorized phone with the AI demo. It does not\n                dial a real customer. Budget ₹200; review provider spend between\n                attempts.','A real 90-second AI call. Trial accounts may require recipient verification. The demo has a shared usage limit; no automatic redials.')
s=s.replace('                    (voice.config?.maxAttempts || 3)','                    (voice.config?.maxAttempts || 3)')
# Insert original proof in the existing Recent fragment.
s=s.replace('{page === "Recent" && (\n                <>','{page === "Recent" && (\n                <>\n                  <button className="og-proof-record og-card" onClick={()=>setReview(verifiedCall as Call)}><span className="og-badge green">REAL CALL · VERIFIED</span><div><strong>Walk-out recovery · recorded acceptance test</strong><p>8 Nov · Hindi · 88 seconds · shopper roleplay, phone omitted</p></div><ArrowRight size={18}/></button>')
# Add agent modal and durable workspace errors before existing callOpen modal.
s=s.replace('      {callOpen && (','''      {agentOpen && <Dialog title={{avani:'AvaniBot',asm:'ASM Agent',coach:'Practise a call',followup:'Follow-up agent',telecaller:'Call back · human calling'}[agentOpen]} onClose={()=>{setAgentOpen(null);void voice.reload();}} wide><Suspense fallback={<div className="og-dialog-body">Opening assistant…</div>}><AgentPanel role={agentOpen} onRecovery={()=>{setAgentOpen(null);setCallOpen(true)}}/></Suspense></Dialog>}
      {remote.error && <div className="og-save-error" role="alert">{remote.error}<button onClick={()=>void remote.reload()}>Reconnect</button></div>}
      {callOpen && (''')
# Actual approved tasks in existing dashboard fragment.
s=s.replace('{page === "Dashboard" && (\n            <>','{page === "Dashboard" && (\n            <>\n              {remote.state.tasks.length>0&&<section className="og-card og-live-tasks"><div className="og-section-title">YOUR NEXT ACTIONS<span>From your reviewed agent plan</span></div>{remote.state.tasks.map(t=><div key={t.id}><button aria-label={`Mark ${t.title} ${t.status===\'done\'?\'open\':\'done\'}`} onClick={()=>void post(\'/api/tasks/complete\',{id:t.id}).then(remote.reload)}>{t.status===\'done\'?<Check size={16}/>:<span className="og-task-circle"/>}</button><div><strong style={{textDecoration:t.status===\'done\'?\'line-through\':\'none\'}}>{t.title}</strong><p>{leads.find(l=>l.id===t.leadId)?.name} · {t.owner}</p></div></div>)}</section>}\n')
p.write_text(s)
p=Path('src/main.tsx');s=p.read_text().replace('import { Workspace }','import { WorkspaceProvider } from "./workspaceState";\nimport { Workspace }').replace(' : <Workspace />',' : <WorkspaceProvider><Workspace /></WorkspaceProvider>');p.write_text(s)
p=Path('src/useCalls.ts');s=p.read_text().replace('async function start() {','async function start(options?: {phone:string;consent:boolean;leadId?:string}) {').replace('{ requestId: crypto.randomUUID() }','{ requestId: crypto.randomUUID(), ...options }').replace('start, latest }','start, latest, reload:load }');p.write_text(s)
