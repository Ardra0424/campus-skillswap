const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const USERS_FILE = path.join(__dirname, 'users.json');
const CHATS_FILE = path.join(__dirname, 'chats.json');
const REQ_FILE = path.join(__dirname, 'requests.json');

if(!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if(!fs.existsSync(CHATS_FILE)) fs.writeFileSync(CHATS_FILE, '[]');
if(!fs.existsSync(REQ_FILE)) fs.writeFileSync(REQ_FILE, '[]');

const getUsers = ()=> JSON.parse(fs.readFileSync(USERS_FILE));
const saveUsers = (u)=> fs.writeFileSync(USERS_FILE, JSON.stringify(u,null,2));
const getChats = ()=> JSON.parse(fs.readFileSync(CHATS_FILE));
const saveChats = (c)=> fs.writeFileSync(CHATS_FILE, JSON.stringify(c,null,2));
const getReqs = ()=> JSON.parse(fs.readFileSync(REQ_FILE));
const saveReqs = (r)=> fs.writeFileSync(REQ_FILE, JSON.stringify(r,null,2));

// Try MySQL if available, else use file (works 100%)
let db=null; try{ db=require('./db'); }catch(e){}

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));

// REGISTER
app.post('/api/register', (req,res)=>{
  let users=getUsers();
  if(users.find(u=>u.email.toLowerCase()===req.body.email.toLowerCase()))
    return res.json({success:false, message:"Account exists. Please Login."});
  let newUser={id:Date.now(), name:req.body.name, email:req.body.email, dept:req.body.dept, phone:req.body.phone, password:req.body.password, have_skills:"", want_skills:"", bio:"Hey, I'm using SkillSwap!", avatar:""};
  users.push(newUser); saveUsers(users);
  if(db){ db.query("INSERT IGNORE INTO users (name,email,dept,phone,password) VALUES (?,?,?,?,?)", [newUser.name,newUser.email,newUser.dept,newUser.phone,newUser.password], ()=>{}); }
  res.json({success:true, message:"Account created!"});
});

// LOGIN - only if exists
app.post('/api/login', (req,res)=>{
  let users=getUsers();
  const user=users.find(u=>u.email.toLowerCase()===req.body.email.toLowerCase());
  if(!user) return res.json({success:false, message:"No account found with this email. Please create a new account."});
  if(user.password!==req.body.password) return res.json({success:false, message:"Wrong password"});
  res.json({success:true, user});
});

app.get('/api/users', (req,res)=> res.json(getUsers()));

// UPDATE PROFILE
app.post('/api/update-profile', (req,res)=>{
  let users=getUsers();
  let idx=users.findIndex(u=>u.id==req.body.id);
  if(idx>-1){
    users[idx]={...users[idx], name:req.body.name, dept:req.body.dept, phone:req.body.phone, bio:req.body.bio};
    saveUsers(users);
    res.json({success:true, user:users[idx]});
  } else res.json({success:false});
});

// UPDATE SKILLS - only in profile
app.post('/api/update-skills', (req,res)=>{
  let users=getUsers();
  let idx=users.findIndex(u=>u.id==req.body.id);
  if(idx>-1){
    users[idx].have_skills=req.body.have_skills;
    users[idx].want_skills=req.body.want_skills;
    saveUsers(users);
    res.json({success:true, user:users[idx]});
  } else res.json({success:false});
});

// CHANGE PASSWORD
app.post('/api/change-password', (req,res)=>{
  let users=getUsers();
  let idx=users.findIndex(u=>u.id==req.body.id);
  if(idx>-1 && users[idx].password===req.body.oldPassword){
    users[idx].password=req.body.newPassword;
    saveUsers(users);
    res.json({success:true});
  } else res.json({success:false, message:"Old password wrong"});
});

// CHAT REQUEST
app.post('/api/send-request', (req,res)=>{
  let reqs=getReqs();
  reqs.push({id:Date.now(), from:req.body.from, to:req.body.to, status:"pending", time:new Date().toISOString()});
  saveReqs(reqs);
  res.json({success:true});
});
app.get('/api/requests/:userId', (req,res)=>{
  let reqs=getReqs().filter(r=>r.to==req.params.userId && r.status==="pending");
  res.json(reqs);
});
app.post('/api/accept-request', (req,res)=>{
  let reqs=getReqs();
  let r=reqs.find(x=>x.id==req.body.id);
  if(r) r.status="accepted";
  saveReqs(reqs);
  res.json({success:true});
});

// CHAT MESSAGES
app.post('/api/chat/send', (req,res)=>{
  let chats=getChats();
  chats.push({id:Date.now(), from:req.body.from, to:req.body.to, msg:req.body.msg, time:new Date().toLocaleTimeString()});
  saveChats(chats);
  res.json({success:true});
});
app.get('/api/chat/:u1/:u2', (req,res)=>{
  let chats=getChats().filter(c=> (c.from==req.params.u1 && c.to==req.params.u2) || (c.from==req.params.u2 && c.to==req.params.u1));
  res.json(chats);
});
app.post('/api/chat/clear', (req,res)=>{
  let chats=getChats().filter(c=> !((c.from==req.body.u1 && c.to==req.body.u2) || (c.from==req.body.u2 && c.to==req.body.u1)));
  saveChats(chats);
  res.json({success:true});
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));