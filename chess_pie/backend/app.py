from legal import *
from flask import Flask, jsonify, request
from flask_cors import CORS
from utils import convert_coord
from Game import GameClass

app = Flask(__name__)
CORS(app)


@app.route("/start")
def start():
    global game
    game=GameClass()
    return "game started"


@app.route("/move", methods=["GET"])
def move():
    print("------------------------------------------------------------ \n \n New Move \n \n ------------------------------------------------------------")
    coord = request.args.get('move') # a 1
    coord = coord.split("-")
    startPrev = coord[0]
    endPrev = coord[1]
    took = coord[2]
    start = [*startPrev]
    end = [*endPrev]
    legal = isLegal(game,start,end,took)
    start00 = convert_coord(start,0)
    end00 = convert_coord(end,0)
    if legal:
        print(game)
        game.update_board(start00, end00)
    return jsonify({"legal": bool(legal)})

if __name__ == "__main__":
    app.run(debug=True)
