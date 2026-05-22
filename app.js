import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginBox = document.getElementById("loginBox");
const chatBox = document.getElementById("chatBox");

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");

const usersList = document.getElementById("usersList");

const groupBtn = document.getElementById("groupBtn");

const chatTitle = document.getElementById("chatTitle");

const picker = document.getElementById("picker");

const emojiBtn = document.getElementById("emojiBtn");

let currentChat = "group";

let currentUsername = "";

signupBtn.onclick = async ()=>{

  try{

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    await setDoc(doc(db,"users",userCredential.user.uid),{
      username: username.value,
      email: email.value
    });

    alert("Account Created");

  }catch(err){
    alert(err.message);
  }

};

loginBtn.onclick = async ()=>{

  try{

    await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

  }catch(err){
    alert(err.message);
  }

};

logoutBtn.onclick = async ()=>{
  await signOut(auth);
};

onAuthStateChanged(auth, async(user)=>{

  if(user){

    loginBox.classList.add("hidden");
    chatBox.classList.remove("hidden");

    const userDoc = await getDocs(collection(db,"users"));

    userDoc.forEach((docu)=>{
      if(docu.id === user.uid){
        currentUsername = docu.data().username;
      }
    });

    loadUsers();

    loadMessages();

  }else{

    loginBox.classList.remove("hidden");
    chatBox.classList.add("hidden");

  }

});

async function loadUsers(){

  usersList.innerHTML = "";

  const querySnapshot = await getDocs(collection(db,"users"));

  querySnapshot.forEach((docu)=>{

    if(docu.id !== auth.currentUser.uid){

      const div = document.createElement("div");

      div.classList.add("userItem");

      div.innerText = docu.data().username;

      div.onclick = ()=>{

        const ids = [auth.currentUser.uid, docu.id].sort();

        currentChat = `private_${ids[0]}_${ids[1]}`;

        chatTitle.innerText = docu.data().username;

        loadMessages();

      };

      usersList.appendChild(div);

    }

  });

}

groupBtn.onclick = ()=>{

  currentChat = "group";

  chatTitle.innerText = "Group Chat";

  loadMessages();

};

sendBtn.onclick = async ()=>{

  if(messageInput.value.trim() === "") return;

  await addDoc(collection(db,"messages"),{

    text: messageInput.value,

    username: currentUsername,

    uid: auth.currentUser.uid,

    chat: currentChat,

    createdAt: serverTimestamp()

  });

  messageInput.value = "";

};

let unsubscribeMessages = null;

function loadMessages(){

  if(unsubscribeMessages){
    unsubscribeMessages();
  }

  const q = query(
    collection(db,"messages"),
    orderBy("createdAt")
  );

  unsubscribeMessages = onSnapshot(q,(snapshot)=>{

    messages.innerHTML = "";

    snapshot.forEach((docu)=>{

      const data = docu.data();

      if(data.chat === currentChat){

        showMessage(data);

      }

    });

  });

}


function showMessage(data){

  const div = document.createElement("div");

  div.classList.add("message");

  if(data.uid === auth.currentUser.uid){
    div.classList.add("me");
  }

  div.innerHTML = `
    <b>${data.username}</b><br>
    ${data.text}
  `;

  messages.appendChild(div);

  messages.scrollTop = messages.scrollHeight;

}

emojiBtn.onclick = ()=>{

  if(picker.style.display === "none"){
    picker.style.display = "block";
  }else{
    picker.style.display = "none";
  }

};

picker.addEventListener("emoji-click",(event)=>{

  messageInput.value += event.detail.unicode;

});