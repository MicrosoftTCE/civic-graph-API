import logging
from flask import Flask
from flask.ext.cache import Cache

from database import db


def create_app():
    app = Flask(__name__)
    app.config.from_pyfile('../config.py')
    wfilehandler = logging.FileHandler('log/werkzeug.log')
    wfilehandler.setLevel(logging.DEBUG)
    wlog = logging.getLogger('werkzeug')
    wlog.setLevel(logging.DEBUG)
    wlog.addHandler(wfilehandler)
    filehandler = logging.FileHandler('log/flask.log')
    filehandler.setLevel(logging.DEBUG)
    app.logger.setLevel(logging.DEBUG)
    app.logger.addHandler(filehandler)
    return app


app = create_app()

cache = Cache(app, config={'CACHE_TYPE': 'redis', 'CACHE_DEFAULT_TIMEOUT': 1000000000})


@app.teardown_appcontext
def shutdown_session(exception=None):
    db.remove()
