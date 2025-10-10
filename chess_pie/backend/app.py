from legal import *
from flask import Flask, jsonify, request
from flask_cors import CORS
from Game import *

app = Flask(__name__)
CORS(app)

@app.route("/start")
def start():
    global game
    game=Game()
    return "game started"


@app.route("/move", methods=["GET"])
def move():
    coord = request.args.get('move')
    coord = coord.split("-")
    startPrev = coord[0]
    endPrev = coord[1]
    took = coord[2]
    start=[]
    end=[]
    for i in startPrev:
        start.append(i)
    for a in endPrev:
        end.append(a)
    legal = isLegal(game,start,end,took)
    return jsonify({"legal": bool(legal)})

if __name__ == "__main__":
    app.run(debug=True)