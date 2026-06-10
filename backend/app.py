from flask import Flask
from flask_cors import CORS
from models.database import init_db
from api.routes import bp
from config import FLASK_SECRET_KEY


def create_app():
    app = Flask(__name__)
    app.secret_key = FLASK_SECRET_KEY

    CORS(app,
         origins=["http://localhost:3000", "http://localhost:5173"],
         supports_credentials=True)

    init_db()
    app.register_blueprint(bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000, threaded=True)
