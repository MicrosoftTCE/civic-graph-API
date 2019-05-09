from flask import Flask
from flask_caching import Cache
from flask_redis import FlaskRedis

from database import db

redis_store = FlaskRedis()

def create_app():
    app = Flask(__name__)
    app.config.from_pyfile('../config.py')
    redis_store.init_app(app)
    return app

app = create_app()

cache = Cache(app, config={
    'CACHE_TYPE': 'redis',
    'CACHE_DEFAULT_TIMEOUT': 1000000000,
    'CACHE_KEY_PREFIX': 'CG-API:' + app.config['APP_POOL_ID'] + ':',
    'CACHE_REDIS_URL': app.config['REDIS_URL']
})


@app.teardown_appcontext
def shutdown_session(exception=None):
    db.remove()
