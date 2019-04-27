var last_gamedata_version = -1;
var player_id = -1;
var trump_suit;
var poll_timer = null;
var show_trump = 'colour';
var spectating = false;
var query_timeout = 2000;
var myBetAmount = -1;
var myBetSuit = '';
var viewing_opponent = false;


class set {

	constructor(player_id) {
		this.canvas = document.getElementById("canvas");
		this.ctx = canvas.getContext("2d");
		this.player_id = player_id;
	}

	logClick(evt) {
		console.log(evt)
	}

	static num_to_coordinates(k) {
		var	ret = [];
		while (ret.length < 4) {
			ret.push(k % 3)
			k = Math.floor(k/3)
		}
		return ret
	}
	static isSet(a) {
		if (a.length != 3) {
			return false;
		}
		var c = [];
		for (var i = 0; i < 3; i++) {
			c.push(this.num_to_coordinates(a[i]))
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

	draw (cards) {

	}

	getGameState() {
		return
	}

	static updateCanvas(height) {
		console.log('hello')
		var canvas = document.getElementById("canvas");
		var ctx = canvas.getContext("2d");
		ctx.fillStyle = "rgb("+Math.random()*256+"," + Math.random()*256+","+Math.random()*256+")";
		ctx.fillRect(0, 0, 150, height);
	}
}

	var canvas = document.getElementById("canvas");
// canvas.addEventListener("click",logClick);

console.log("DIU")
// window.setInterval(set.updateCanvas, 1000, 123);