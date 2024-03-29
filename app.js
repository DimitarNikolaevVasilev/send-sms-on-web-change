process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const p = require('node-html-parser');
const parse = p.parse;
var express = require('express');

const rp = require('request-promise');
const url = process.env.url;
const fs = require('fs');

const Nexmo = require('nexmo');

const nexmo = new Nexmo({
    apiKey: process.env.nexmo_api_key,
    apiSecret: process.env.nexmo_api_secret
  }, {debug:true});


var elements_size;
try{
	elements_size = +fs.readFileSync('./elements_size', 'utf8');
}catch(err){
	elements_size = 12;
	fs.writeFileSync('./elements_size', elements_size);
}


function getHTMLElements(parent){
	var size = 0;
	for(let i = 0;i<parent.childNodes.length;i++){
		var ch = parent.childNodes[i];
		if(ch.tagName == 'li')size++;
		if(ch.tagName == 'ul' || ch.tagName == 'li')size += getHTMLElements(ch);
	}
	return size;
}

function go(){
	rp(url).then(function(html){
		var root = parse(html);
		var docs = root.querySelector('.documents');
		var size = getHTMLElements(docs);
		if(size != elements_size){
			//nexmo.message.sendSms(process.env.msg_title, process.env.msg_phone, process.env.msg_msg);
			console.log('SENT ' + size);
			fs.writeFile('./elements_size', size,()=>{});
			elements_size = size;
		}else{
			console.log(new Date() + ' Nothing new');
			setTimeout(function(){
				go();
			}, 1000 * 60 * (process.env.min_min + Math.floor(Math.random() * (process.env.min_max - process.env.min_min))));
		}
	}).catch(function(err){
		console.log(err);
	});
}



setInterval(function() {
	request("https://send-sms-on-web-change.herokuapp.com/");
}, 60000 * 10); // every 10 minutes


var app = express();

app.get('/', (res, req) => {
	res.send('OK');
});

app.listen(process.env.PORT, () => {console.log('LISTENING AT PORT ' + process.env.PORT)});


go();


