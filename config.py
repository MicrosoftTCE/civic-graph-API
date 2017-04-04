import os, socket
from pprint import pformat

def environ_get(key, default=None):
    # Azure prefixes web app setting names with "APPSETTING_"
    key = 'APPSETTING_' + key

    if key in os.environ or default is not None:
        return os.environ.get(key, default)
    else:
        raise AssertionError('Missing required environment variable: ' + key + '. ' +
                             'If this is an Azure environment, ensure that the ' +
                             'web app Applicaiton Settings are populated. If this ' +
                             'is local dev, ensure that you create a .env file. ' +
                             'Current os.environ is: ' + pformat(os.environ))


SQLALCHEMY_DATABASE_URI = ('mysql+pymysql://' +
                           environ_get('MYSQL_USERNAME') + ':' +
                           environ_get('MYSQL_PASSWORD') + '@' +
                           environ_get('MYSQL_HOST') + '/' +
                           environ_get('DATABASE_NAME', 'civicgraph') + '?charset=utf8')

PROPAGATE_EXCEPTIONS = environ_get('PROPAGATE_EXCEPTIONS', True)

# Minify all API requests.
JSONIFY_PRETTYPRINT_REGULAR = environ_get('JSONIFY_PRETTYPRINT_REGULAR', False)

# Setup redis server cache for event.
REDIS_URL = environ_get('REDIS_URL')

# Civic Graph admin credentials.
ADMIN_NAME = environ_get('ADMIN_NAME')
ADMIN_HASH = environ_get('ADMIN_HASH')

# import base64, os; base64.b64encode(os.urandom(24)).decode('utf-8')
FLASK_SESSION_SECRET_KEY = environ_get('FLASK_SESSION_SECRET_KEY')

# Azure Application Insights instrumentation key
APP_INSIGHTS_INSTRUMENTATION_KEY = environ_get('APP_INSIGHTS_INSTRUMENTATION_KEY')

# Special env variable that exists within Azure to distinguish between
# application pools (i.e. "Deployment slots" within a Web App service plan).
# This is useful for allowing different deployment slots to do unique
# things, like have their own Redis namespace. Default to local host name
# in dev (to distinguish laptops apart when accessing shared resources).
APP_POOL_ID = os.environ.get('APP_POOL_ID', socket.gethostname())
