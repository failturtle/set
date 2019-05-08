import bottle
import string
import random
import sys
import json
import copy


@bottle.route('/')
def page_index():
	return page_static('index.html')

# This is the entire information about the game, because I'm lazy.
# You can use it to look at other people's hands and cheat. But whatever.
@bottle.route('/<game_id>/')
def page_gamestate(game_id):
	return page_static('game.html')

@bottle.route('/static/<filename>')
def page_static(filename):
	return bottle.static_file(filename, root='./static/')

@bottle.route('/static/img/<filename>')
def page_static_img(filename):
	return bottle.static_file(filename, root='./static/img/')
# @bottle.post('/action')
# def page_action():

all_games = {}
cards_queue = {}

def get_num_players(game_id):
	cur = all_games[game_id]
	return cur["num_players"]

def isThereNextCard(game_id):
	return len(cards_queue[game_id]) > 0

def getNextCard(game_id):
	c = cards_queue[game_id]
	r = -1
	if c and len(c) >= 1:
		r = c[0]
		c = c[1:]
		cards_queue[game_id] = c
	return r

def isSet(a0, a1, a2):
	c0 = num_to_coordinates(a0)
	c1 = num_to_coordinates(a1)
	c2 = num_to_coordinates(a2)
	for i in range(4):
		s = set()
		s.add(c0[i])
		s.add(c1[i])
		s.add(c2[i])
		if len(s) == 2:
			return False
	return True

def isThereASet(a):
	l = len(a)
	for i in range(l):
		for j in range(l):
			for k in range(l):
				if i != j and i != k and j != k:
					if isSet(a[i], a[j], a[k]):
						return True
	return False

def num_to_coordinates(k):
	ret = []
	while len(ret) < 4:
		ret.append(k % 3)
		k //= 3
	return ret

def ensureValidSet(game_id):
	while isThereNextCard(game_id) and not isThereASet(all_games[game_id]['cards']):
		all_games[game_id]['cards'].append(getNextCard(game_id))
		all_games[game_id]['cards'].append(getNextCard(game_id))
		all_games[game_id]['cards'].append(getNextCard(game_id))
	if not isThereASet(all_games[game_id]['cards']):
		return False
	return True

def get_new_game(game_id):
	cards = [x for x in range(81)]
	random.shuffle(cards)
	cards_queue[game_id] = cards[12:]
	cards = cards[:12]
	newGame = {
		"num_players": 0,
		"player_scores": [],
		"cards": cards,
		"last_set": [],
		"last_set_player": -1,
		"has_game_ended": 0
	}
	all_games[game_id] = newGame

def reset_game(game_id):
	all_games.pop(game_id, None)
	return create_new_game(game_id)

def create_new_game(game_id):
	if game_id not in all_games:
		newGame = get_new_game(game_id)
	ensureValidSet(game_id)
	return all_games[game_id]

def getNextCard(game_id):
	if not isThereNextCard(game_id):
		return -1
	c = cards_queue[game_id][0]
	cards_queue[game_id] = cards_queue[game_id][1:]
	return c

@bottle.route('/<game_id>/game_state')
def page_game(game_id):
	create_new_game(game_id)
	return json.dumps(all_games[game_id])

@bottle.post('/<game_id>/action')
def post_game(game_id):
	data = json.loads(bottle.request.body.read())
	player = int(data['player_id']) - 1
	cards = data['cards']
	if not isSet(cards[0], cards[1], cards[2]):
		return bottle.HTTPResponse(status=200, body='')
	all_games[game_id]['last_set'] = cards
	all_games[game_id]['last_set_player'] = player
	all_games[game_id]['player_scores'][player] += 1
	if len(all_games[game_id]['cards']) > 12:
		for c in cards:
			all_games[game_id]['cards'].pop(c)
	else:
		for c in cards:
			all_games[game_id]['cards'][c] = getNextCard(game_id)
		while -1 in all_games[game_id]['cards']:
			all_games[game_id]['cards'].remove(-1)
	if not ensureValidSet(game_id):
		all_games[game_id]['has_game_ended'] = 1
	return bottle.HTTPResponse(status=200, body='')

def randomString(stringLength=10):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))

@bottle.get('/newgame')
def newgame():
	return bottle.redirect('/'+randomString()+'/')

@bottle.get('/<game_id>/newplayer')
def api_newplayer(game_id):
	create_new_game(game_id)
	cur = all_games[game_id]
	cur["num_players"] += 1
	cur["player_scores"].append(0)
	return json.dumps(cur["num_players"])

@bottle.get('/<game_id>/reset')
def reset(game_id):
	reset_game(game_id)
	return bottle.redirect('/'+game_id+'/')

# Select underlying server
server = 'wsgiref'
port = 5001

for i in sys.argv[1:]:
	if i[:2] == '-s':
		server = i[2:]
	if i[:2] == '-p':
		port = int(i[2:])

bottle.run(host = '0.0.0.0', port = port, server = server)
# f =  [79, 50, 41, 53, 38, 10, 54, 0, 15, 76, 72, 26]
# print(isThereASet(f))
