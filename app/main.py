from flask import Flask
from flask_cache import Cache
from flask_redis import FlaskRedis

from database import db

from applicationinsights.exceptions import enable
from applicationinsights.requests import WSGIApplication

redis_store = FlaskRedis()

def create_app():
    app = Flask(__name__)
    app.config.from_pyfile('../config.py')
    redis_store.init_app(app)
    return app

app = create_app()

if app.config['APP_INSIGHTS_INSTRUMENTATION_KEY']:
    # log unhandled exceptions to Azure Application Insights
    enable(app.config['APP_INSIGHTS_INSTRUMENTATION_KEY'])
    # log requests to Azure Application Insights
    app.wsgi_app = WSGIApplication(app.config['APP_INSIGHTS_INSTRUMENTATION_KEY'], app.wsgi_app)

cache = Cache(app, config={
    'CACHE_TYPE': 'redis',
    'CACHE_DEFAULT_TIMEOUT': 1000000000,
    'CACHE_KEY_PREFIX': 'CG-API:' + app.config['APP_POOL_ID'] + ':',
    'CACHE_REDIS_URL': app.config['REDIS_URL']
})


@app.teardown_appcontext
def shutdown_session(exception=None):
    db.remove()
