var player_id = -1;
var CARD_WIDTH = 164;
var CARD_HEIGHT = 94;
var isSelected = [];
var isImageLoaded = 0;
var query_timeout = 2000;
var poll_timer = null;

var cc = new Image();
cc.src = "../static/img/cards.png"
cc.onload = main
var currentCoordinates = []

function constructor() {
	canvas = document.getElementById("canvas");
	cards = new Image()
	cards.src = "./img/cards.png"
}

function logClick(evt) {
	console.log(evt)
}

function num_to_coordinates(k) {
	var	ret = [];
	while (ret.length < 4) {
		ret.push(k % 3)
		k = Math.floor(k/3)
	}
	return ret
}

function isSet(a) {
	if (a.length != 3) {
		return false;
	}
	var c = [];
	for (var i = 0; i < 3; i++) {
		c.push(num_to_coordinates(a[i]))
	}
	for (var i = 0; i < 4; i++) {
		var s = new Set();
		for (var j = 0; j < 3; j++) {
			s.add(c[j][i]);
		}
		if (s.size == 2) {
			return false;
		}
	}
	return true;
}

function getImageCoordinate(a) {
	// magic numbers woo
	var x = 45
	var y = 20
	y += 285 * a[0]
	x += 508 * a[1]
	y += 95 * a[2]
	x += 170 * a[3]
	return [x, y, CARD_WIDTH, CARD_HEIGHT]
}

function draw (cards) {
	console.log('fuck')
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	currentCoordinates = []
	for (var i = 0; i < cards.length; i++) {
		var screenCoordinate = getScreenCoordinate(i, cards.length);
		var kek = num_to_coordinates(cards[i]);
		var card = getImageCoordinate(kek)
		if (isSelected.indexOf(i) != -1) {
			// alert(1);
			ctx.strokeStyle = "#339FC4"
			ctx.lineWidth=3
			ctx.strokeRect(screenCoordinate[0]-2, screenCoordinate[1]-2,CARD_WIDTH+2, CARD_HEIGHT+2)
		}
		
		ctx.drawImage(cc, card[0], card[1], CARD_WIDTH, CARD_HEIGHT, 
			screenCoordinate[0], screenCoordinate[1], CARD_WIDTH, CARD_HEIGHT)
		currentCoordinates.push([screenCoordinate[0], screenCoordinate[1]])
	}
}

function getScreenCoordinate(idx, num_cards) {
	var x = idx % 3
	var y = Math.floor(idx/3)
	var xx = 120
	var yy = 30 
	var y_offset = 150
	if (num_cards > 12) {
		y_offset = 110
	}
	if (num_cards > 15) {
		yy = 5
		y_offset = 100
	}
	return [xx + x * 200, yy + y * y_offset]
}

function updateTheView(data, status) {
	$("p.alert").hide();
	poll_timer = window.setTimeout(getGameData, 400);
}

function handleUpdateError(request, status, error) {
	poll_timer = window.setTimeout(getGameData, 800);
	$("p.alert").show();
	console.log('Ajax request failed:', status, ', ', error)
}

function getGameData() {
	window.clearTimeout(poll_timer);
	$.ajax({
		'type': 'GET',
		'url': './gamestate',
		'dataType': 'json',
		'timeout': query_timeout,
		'success': updateTheView,
		'error': handleUpdateError,
	});
}

function updateCanvas(height) {
	console.log('hello')
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = "rgb("+Math.random()*256+"," + Math.random()*256+","+Math.random()*256+")";
	ctx.fillRect(0, 0, 150, height);
}

function sendResult(isSelected) {
	$.ajax({
		'type': 'POST',
		'url': '/gamestate',
		'data': isSelected,
		'dataType': 'json',
		'timeout': query_timeout,
		'success': updateTheView,
		'error': handleUpdateError,
	});
}
	
function toggle(evt) {
	var x = evt.offsetX;
	var y = evt.offsetY;
	for (var i = 0; i < currentCoordinates.length; i++) {
		var xx = currentCoordinates[i][0];
		var yy = currentCoordinates[i][1];
		if (xx <= x && yy <= y && x <= xx + CARD_WIDTH && y <= yy + CARD_HEIGHT) {
			if (isSelected.indexOf(i) == -1) {
				isSelected.push(i)
				if (isSelected.length == 3) {
					if (isSet(isSelected)) {
						sendResult(isSelected);
					}
				}
			} else {
				isSelected.splice(isSelected.indexOf(i), 1);
			}
			break;
		}
	}
}


function updateNewPlayer(data, status) {
	player_id = int(data);
	poll_timer = window.setTimeout(getGameData, 400);
	$("button.join").hide()
}

function handleUpdateError(request, status, error) {
	poll_timer = window.setTimeout(getGameData, 800);
	$("p.alert").show();
	console.log('Ajax request failed:', status, ', ', error)
}

function joinAsNewPlayer() {
	$.ajax({
		'type': 'GET',
		'url': './newplayer',
		'dataType': 'text',
		'timeout': query_timeout,
		'success': updateTheView,
		'error': handleUpdateError,
	});
}

function main() {
	console.log("DIU2")

	
	// s.updateCanvas(123)
	
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	canvas.addEventListener("click", toggle);
	// ctx.fillSTyle = "blue";
	// ctx.fillRect(0, 0, canvas.width, canvas.height);
	// while (isImageLoaded == 0) {
	// 	console.log("wait!");
	// }
	c = []
	for (var i = 0; i < 12; i++) {
		c.push(Math.floor((Math.random() * 81) + 1));
	}
	draw(c);
	console.log("DIU")
	window.setInterval(draw, 200, c)
	
	// window.setInterval(set.updateCanvas, 1000, 123);
}