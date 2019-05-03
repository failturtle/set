import bottle
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

def getNextCard(game_id):
	c = cards_queue[game_id]
	r = -1
	if c and len(c) >= 1:
		r = c[0]
		c = c[1:]
		cards_queue[game_id] = c
	return r

def create_new_game(game_id):
	if game_id not in all_games:
		cards = [x for x in range(81)]
		random.shuffle(cards)
		cards_queue[game_id] = cards[12:]
		cards = cards[:12]
		newGame = {
			"num_players": 0,
			"player_scores": [],
			"cards": cards,
			"last_set": [],
			"last_set_player": -1
		}
		all_games[game_id] = newGame
	return all_games[game_id]

def get_num_players(game_id):
	cur = all_games[game_id]
	return cur["num_players"]

@bottle.route('/<game_id>/game_state')
def page_game(game_id):
	create_new_game(game_id)
	return json.dumps(all_games[game_id])

@bottle.get('/<game_id>/newplayer')
def api_newplayer(game_id):
	create_new_game(game_id)
	cur = all_games[game_id]
	cur["num_players"] += 1
	cur["player_scores"].append(0)
	return json.dumps(cur["num_players"])

# Select underlying server
server = 'wsgiref'
port = 5001

for i in sys.argv[1:]:
	if i[:2] == '-s':
		server = i[2:]
	if i[:2] == '-p':
		port = int(i[2:])

bottle.run(host = '0.0.0.0', port = port, server = server)
