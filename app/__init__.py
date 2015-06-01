from flask import Flask
from flask.ext.cache import Cache

app = Flask(__name__)
app.config.from_object('config')
cache = Cache(app, config={'CACHE_TYPE': 'simple', 'CACHE_DEFAULT_TIMEOUT': 922337203685477580})

from app import views, models
from database import db

@app.teardown_appcontext
def shutdown_session(exception=None):
    db.remove()