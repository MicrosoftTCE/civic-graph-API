from flask import Flask

app = Flask(__name__)
app.config.from_object('config')
app.jinja_env.add_extension('pyjade.ext.jinja.PyJadeExtension')

from app import views, models
from database import db

@app.teardown_appcontext
def shutdown_session(exception=None):
    db.remove()