from flask import Flask
from flask.ext.cache import Cache
import logging

def create_app():
    app = Flask(__name__)
    app.config.from_object('config')
    wfilehandler = logging.FileHandler('werkzeug.log')
    wfilehandler.setLevel(logging.DEBUG)
    wlog = logging.getLogger('werkzeug')
    wlog.setLevel(logging.DEBUG)
    wlog.addHandler(wfilehandler)
    filehandler = logging.FileHandler('flask.log')
    filehandler.setLevel(logging.DEBUG)
    app.logger.setLevel(logging.DEBUG)
    app.logger.addHandler(filehandler)
    return app

app = create_app()
cache = Cache(app, config={'CACHE_TYPE': 'simple', 'CACHE_DEFAULT_TIMEOUT': 1000000000})

from app import views, models
from database import db

@app.teardown_appcontext
def shutdown_session(exception=None):
    db.remove()
