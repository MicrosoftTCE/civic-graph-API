from flask import Flask
from flask_cache import Cache
from flask_redis import FlaskRedis
from flask_cors import CORS

from database import db

redis_store = FlaskRedis()

def create_app():
    app = Flask(__name__)
    app.config.from_pyfile('../config.py')
    redis_store.init_app(app)
    return app

app = create_app()

cors = CORS(app,resources={r'/*': {'origins':'*'}})

cache = Cache(app, config={
    'CACHE_TYPE': 'redis',
    'CACHE_DEFAULT_TIMEOUT': 1000000000,
    'CACHE_KEY_PREFIX': 'CG_',
    'CACHE_REDIS_URL': app.config['REDIS_URL']
})


@app.teardown_appcontext
def shutdown_session(exception=None):
    db.remove()
