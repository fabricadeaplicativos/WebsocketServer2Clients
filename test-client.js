var ws = require('ws');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});



rl.on('close', function(){
	rl.close();
	process.kill();
})


ws = new ws('ws:127.0.0.1:8080');

ws.on('open', function(){
	rl.on('line', function(line){
		ws.send(line);
	});
});

ws.on('message', function(message){
	console.log(message);
});

ws.on('close', function(){
	process.kill();
});