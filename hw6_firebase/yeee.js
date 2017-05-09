function signUp(email, password) {
  const auth = firebase.auth();
  return auth
    .createUserWithEmailAndPassword(email, password)
    .then(function(user) {
      alert('註冊完成');
      return user;
    })

    .catch(function(error) {
      alert(error.message);
    });

}

function signIn(email, password) {
  const auth = firebase.auth();
  return auth
    .signInWithEmailAndPassword(email, password)
    .then(function(user) {
      alert('登入成功');
      return user;
    })

    .catch(function(error) {
      alert(error.message);
    });

}

function signOut() {
  const auth = firebase.auth();
  return auth
    .signOut()
    .then(function(error) {
      alert('登出成功')
    });
    
}
//-----------------------------------------------------------------------
function updateInfo(form) {
  const auth = firebase.auth();
  const user = auth.currentUser;
  let arr = ['username', 'job', 'age', 'photoUrl', 'descriptions'];
  let obj = {};
  arr.forEach(function(key) {
    obj[key] = form[key].value;
  });

  if (user) {
    obj.uid = user.uid;
    let obj2 = {};
    obj2[`/user/${user.uid}`] = obj;

    firebase.database().ref().update(obj2)
      .then(function() {
        alert("更新成功");
        updateUserView(user);
      })
      .catch(function(error) {
        alert(error.message);
      });
  } else {
    alert("ni 沒有登入");
  }
}


function updateUserView(user) {
  const auth = firebase.auth();
  let arr = ['username', 'job', 'age', 'photoUrl', 'descriptions'];

  if (!user) {
    arr.forEach(function(key) {
      window[key].value = '';
      if (window[key + '_e']) {
        window[key + '_e'].textContent = '';
      }
    });

    photo_e.src = '';
    email_e.textContent = '';
    email.value = '';
    password.value = '';
    return
  };

  return firebase.database()
    .ref(`/user/${user.uid}`)
    .once(`value`)
    .then(x => x.val())
    .then(function(info) {
      if (!info) return;
      arr.forEach(function(key) {
        window[key].value = info[key] || '';
        if (window[key + '_e']) {
          window[key + '_e'].textContent = info[key] || '';
        }
      });

      photo_e.src = info.photoUrl;
      email_e.textContent = user.email;
      email.value = user.email;

    });
}

function receivedMessage(message, user) {
  const auth = firebase.auth();
  const UID = auth.currentUser.uid;
  const msglist = document.querySelector("#messagelist");
  let msgDiv = document.createElement('div');
  let avatar = new Image();
  let name = document.createElement('div');
  let msg = document.createElement('div');

  msgDiv.classList.add('message-container');
  avatar.classList.add('avatar');
  name.classList.add('name');
  msg.classList.add('msg');


  user = user || {
    username: "none",
    photoUrl: 'image/default.jpg',
  };
  user.photoUrl = user.photoUrl || 'image/default.jpg';
  if (UID === message.uid) {
    msgDiv.classList.add('self');
  }
  avatar.src = user.photoUrl;
  name.textContent = user.username;
  msg.textContent = message.message;

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(name);
  msgDiv.appendChild(msg);
  msglist.appendChild(msgDiv);
  msglist.scrollTop = msglist.scrollHeight + 000;
}

firebase.auth().onAuthStateChanged(function(user) {
  updateUserView(user);
  if (user) {
    let userMap={};
    const messageRef = firebase.database().ref('message');
    messageRef.limitToLast(10).off('child_added');
    messageRef.limitToLast(10).on('child_added', function(s) {
      let msg = s.val();
      if (!msg) return;
      if (userMap[msg.uid]) {
        receivedMessage(msg, userMap[msg.uid]);
      } else {
        firebase.database()
          .ref(`/user/${msg.uid}`)
          .once(`value`)
          .then(x => x.val())
          .then(function(info) {
            receivedMessage(msg, userMap[msg.uid]);
          });
      }
    });
  } else {
    const msglist = document.querySelector('#messagelist');
    msglist.innerHTML = '';
    const messageRef = firebase.database().ref('message');
    messageRef.limitToLast(10).off('child_added');
  }
});

//----------------------------------------------------------------
function sendMessage(form) {
  const auth = firebase.auth();
  const UID = auth.getUid();
  if (!UID) {
    alert("尚未登入");
    return false;
  }
  let messageText = form.message.value;
  if (!messageText.trim()) {
    alert("type something.");
    return false;
  }
  let messageRef = firebase.database().ref('message');
  let childRef = messageRef.push();

  form.message.value = "";
  childRef.set({
    uid: UID,
    message: messageText
  })
}
photo.onchange = function() {
  const auth = firebase.auth();
  const user = auth.currentUser;
  if (!this.value) {
    photoUrl.value = '';
    return;
  }
  if (user) {
    let file = this.files[0];
    let sRef = firebase.storage().ref(`/user/${user.uid}.jpg`);
    let meta = {
      contentType: file.type
    };

    sRef.put(file, meta)
      .then(function(s) {
        photoUrl.value = s.metadata.downloadURLs[0];
      })
      .catch(function(error) {
        alert(error.message);
      });
  } else {
    alert("ni 沒有登入");
  }
};
