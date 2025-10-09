from legal_move.legal_move import *
from legal_move.is_legal import *
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/move", methods=["GET"])
def start():
    legal = isLegal(request)
    return jsonify({"legal": bool(legal)})
if __name__ == "__main__":
    app.run(debug=True)
