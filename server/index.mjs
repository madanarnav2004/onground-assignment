import http from 'node:http';
import { createServer } from 'vite';
import { handler } from './api.mjs';
const port=Number(process.env.PORT||4317);
const vite=await createServer({server:{middlewareMode:true,fs:{deny:['**/.env*','**/.private/**','**/data/**','**/server/**']}},appType:'spa'});
http.createServer(async(req,res)=>{if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(req.headers.host)){res.writeHead(403);return res.end();}if(req.url.startsWith('/api/'))return handler(req,res);if(/^\/(?:\.private|data|server|\.env)(?:\/|\.|$)/.test(req.url)){res.writeHead(404);return res.end();}vite.middlewares(req,res);}).listen(port,'127.0.0.1',()=>console.log(`Workspace: http://127.0.0.1:${port}`));
