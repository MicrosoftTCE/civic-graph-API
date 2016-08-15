import os
from secrets import MYSQL_PASSWORD

basedir = os.path.abspath(os.path.dirname(__file__))

SQLALCHEMY_DATABASE_URI = 'mysql+mysqldb://civicgraph:' + MYSQL_PASSWORD + '@localhost/civicgraph?charset=utf8'
SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository')

PROPAGATE_EXCEPTIONS = True

# Minify all API requests.
JSONIFY_PRETTYPRINT_REGULAR = False

# Setup redis server cache for event.
REDIS_URL = "redis://:password@localhost:6379/0"
