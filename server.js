var WebSocketServer = require('ws').Server, 
	wss = new WebSocketServer({ port: 8080 });

var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

var clients={};

var groups = {};

wss.on('connection', function connection(ws){
	var id = guid();
	clients[id] = ws;
	ws.id = id;
	ws.send(JSON.stringify({guid:id}));
	
	console.log(id);
	ws.on('message', function incomming(message){
		console.log(message);
		var msg = {};
		try{
			msg = JSON.parse(message);
		}catch (ex){
			//nop
		}
		if(msg.method){
			if (msg.method === 'new_group' && !ws.group_id){
				var group_id = guid();
				ws.send(JSON.stringify({'group_id': group_id}));
				groups[group_id] = [ws];
				ws.group_id = group_id;
			}else if(msg.method === 'join' && !ws.group_id && msg.group_id){
				var group_id = msg.group_id;
				if(groups[group_id]){
					ws.send(JSON.stringify({success:'Connected'}));
				}else{
					ws.send(JSON.stringify({error:'No such group'}));
				}
				groups[group_id].push(ws);
			}
		}else{
			if(ws.group_id){
				
			}
			ws.send(message);
		}
	});
	
	ws.on('close', function(){
		console.log('Closed connection with %s', ws.id);
	});
});


