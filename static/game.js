var player_id = -1;
var CARD_WIDTH = 164;
var CARD_HEIGHT = 94;
var isSelected = [];
var isImageLoaded = 0;
var query_timeout = 3000;
var poll_timer = null;
var current_cards = []

var cc = new Image();
cc.src = "../static/img/cards.png"
cc.onload = main
var currentCoordinates = []

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
		c.push(num_to_coordinates(current_cards[a[i]]))
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

function refresh() {
	document.location.reload()
}

function restart() {
	window.clearTimeout(poll_timer);
	$.ajax({
		'type': 'GET',
		'url': './reset',
		'dataType': 'json',
		'timeout': query_timeout,
		'success': refresh,
		'error': handleUpdateError,
	});
}

function updatePlayerScores(player_scores, has_game_ended = 0) {
	l = player_scores.length
	s = "<p> Number of player(s): " + l.toString() + "<br></p>"
	if (player_id === -1) {
		s += '<p><button id="join" onclick=joinAsNewPlayer()> join </button><br><br></p>'
	} else {
		s += '<p>You are player ' + player_id.toString() + '.<br><br></p>'
	}
	s += '<p> Scores <br> </p>'
	s += "<table>"
	for (var i = 0; i < l; i++) {
		s += '<tr>'
		s += '<td>' + "Player " + (i+1).toString() + ":</td>"
		s += '<td>' + (player_scores[i]).toString() + "</td>"
		s += '</tr>'
	}
	s += "</table>"
	
	if (has_game_ended) {
		s += "<p><bold><br><br>GAME OVER!</bold></p>"
		s += "<button onclick=restart()> Click here to restart the game! </button>"
	}

	$('#players').html(s)
}

function equal(a1, a2) {
	if (a1.length != a2.length) {
		return false;
	}
	for (var i = 0; i < a1.length; i++) {
		if (a1[i] != a2[i]) return false;
	}
	return true;
}

function updateTheView(data, status) {
	$("p.alert").hide();

	updatePlayerScores(data['player_scores'], data['has_game_ended'])
	if (!equal(current_cards, data['cards'])) {
		isSelected = []
		current_cards = data['cards']
	}
	draw(current_cards)
	if (data['has_game_ended'] == 0) {
		poll_timer = window.setTimeout(getGameData, 300);
	} else {
		window.clearTimeout(poll_timer);
	}
}

function handleUpdateError(request, status, error) {
	poll_timer = window.setTimeout(getGameData, 300);
	$("p.alert").show();
	console.log('Ajax request failed:', status, ', ', error)
}

function getGameData() {
	window.clearTimeout(poll_timer);
	$.ajax({
		'type': 'GET',
		'url': './game_state',
		'dataType': 'json',
		'timeout': query_timeout,
		'success': updateTheView,
		'error': handleUpdateError,
	});
}

function sendResult(isSelected) {
	$.ajax({
		'type': 'POST',
		'url': './action',
		'data': JSON.stringify(isSelected),
		'dataType': 'application/json',
		'timeout': query_timeout,
		'success': getGameData,
		'error': handleUpdateError
	});
}
	
function toggle(evt) {
	var x = evt.offsetX;
	var y = evt.offsetY;
	for (var i = 0; i < currentCoordinates.length; i++) {
		var xx = currentCoordinates[i][0];
		var yy = currentCoordinates[i][1];
		if (xx <= x && yy <= y && x <= xx + CARD_WIDTH && y <= yy + CARD_HEIGHT && player_id !== -1) {
			if (isSelected.indexOf(i) == -1) {
				isSelected.push(i)
				if (isSelected.length == 3) {
					if (isSet(isSelected)) {
						sendResult({
							'player_id': player_id,
							'cards': isSelected
						});
						isSelected = []
						getGameData();
						break;
					}
					isSelected = []
				}
			} else {
				isSelected.splice(isSelected.indexOf(i), 1);
			}
			break;
		}
	}
	draw(current_cards);
}


function updateNewPlayer(data, status) {
	player_id = Number(data);
	poll_timer = window.setTimeout(getGameData, 300);
	$("button.join").hide()
}

function joinAsNewPlayer() {
	$.ajax({
		'type': 'GET',
		'url': './newplayer',
		'dataType': 'text',
		'timeout': query_timeout,
		'success': updateNewPlayer,
		'error': handleUpdateError,
	});
}

function main() {
	var canvas = document.getElementById("canvas");
	canvas.addEventListener("click", toggle);
	joinAsNewPlayer();
	poll_timer = window.setInterval(getGameData, 300)
}