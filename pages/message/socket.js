var pageName = '';
var socket = io('/message', {
  forceNew: false,
  reconnection: true,
  autoConnect: true,
  transports: ['polling', 'websocket'],
  reconnectionDelay: 5000,
  reconnectionDelayMax: 10000
});

// socket.open();

socket.on('connect', function () {
  console.log('socket连接成功');
});
socket.on('error', function() {
  console.log('socket连接出错');
  socket.disconnect();
});
socket.on('disconnect', function() {
  console.log('socket连接已断开');
});


var getNewMessageNumber = function() {
  // var elements = $('.nav-message-num');
  var elements = document.getElementsByClassName('nav-message-num');
  if(elements.length === 0) return 0;
  var number = Number(elements[0].innerHTML);
  // var number = Number(elements.eq(0).text());
  if(number > 0) return number;
  return 0;
};
var setNewMessageNumber = function(number) {
  // var elements = $('.nav-message-num');
  // var redPoint = $('.newMessagePoint');
  var elements = document.getElementsByClassName('nav-message-num');
  if(elements.length === 0) return 0;
  var redPoint = document.getElementsByClassName('newMessagePoint');
  for(var i = 0; i < redPoint.length; i++) {
    var e = redPoint[i];
    e.style.display = 'inline';
  }
  for(i = 0; i < elements.length; i++) {
    var r = elements[i];
    var c = r.getAttribute('class');
    if(c.indexOf('disabled')) {
      c = c.replace('disabled', '');
      r.setAttribute('class', c);
    }
    r.innerHTML = number;
  }

  // redPoint.css('display', 'block');
  // elements.text(number).removeClass('disabled');
};

socket.on('message', function(data) {
  var ty = data.message.ty;
  if(ty === 'STE') {
    newMessageRemind('notice');
  } else if(ty === 'STU') {
    newMessageRemind('reminder');
  } else if(ty === 'UTU') {
    var user = data.user;
    var myUid = data.myUid;
    if(user.uid !== myUid) {
      newMessageRemind('message');
    }
  } else if(ty === 'friendsApplication') {
    newMessageRemind('friendsApplication');
  }
});

function newMessageRemind(name) {
  if(pageName && pageName === 'message') return;
  beep(name);
  var number = getNewMessageNumber();
  setNewMessageNumber(number+1);
}