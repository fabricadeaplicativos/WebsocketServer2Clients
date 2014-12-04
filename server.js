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

// var clients={};

var groups = {};

function groupBroadCast(group, filter, message){
	var recipients = group.filter(filter);
	recipients.forEach(function(recipient){
		recipient.send(message);
	});
}


function logGroupMembers(group){
	group.forEach(function(member, idx){
		console.log("Member %d on group: %s", idx, member.id);
	});
}

wss.on('connection', function connection(ws){
	var id = guid();
	// clients[id] = ws;
	ws.id = id;
	ws.send(JSON.stringify({guid:id}));
	var filterOut = function(el){
		return el.id != ws.id;
	};
	
	console.log("New connection: %s", id);
	ws.on('message', function incomming(message){
		var msg = {};
		
		
		try{
			msg = JSON.parse(message);
		}catch (ex){
			//nop
		}
		if(msg.method){
			if (msg.method === 'new_group' && !ws.group_id){
				var group_id = guid();
				groups[group_id] = [ws];
				ws.group_id = group_id;
				ws.send(JSON.stringify({'group_id': group_id}));
			}else if(msg.method === 'join' && !ws.group_id && msg.group_id){
				var group_id = msg.group_id;
				if(groups[group_id]){
					ws.group_id = group_id;
					var members = [];
					groups[group_id].forEach(function(member){
						members.push(member.id);
					});
					groups[group_id].push(ws);
					groupBroadCast(groups[group_id], filterOut, JSON.stringify({joined:ws.id}));
					ws.send(JSON.stringify({success:'Connected', group_members:members}));
				}else{
					ws.send(JSON.stringify({error:'No such group'}));
				}
			}
		}else{
			if(ws.group_id){
				var group = groups[ws.group_id];
				groupBroadCast(group, filterOut, message);
			}
		}
	});
	
	ws.on('close', function(){
		console.log('Closed connection: %s', ws.id);
		var index = -1;
		if(ws.group_id && groups[ws.group_id]){
			groups[ws.group_id].forEach(function(el, idx){
				if(el.id == ws.id){
					index = idx;
					return true;
				}
				return false;
			});
			if(index == -1){
				console.log('Error, unable to remove someone from the group...');
			}
			groupBroadCast(groups[ws.group_id], filterOut, JSON.stringify({left:ws.id}));
			groups[ws.group_id].splice(index, 1);
		}
	});
});


