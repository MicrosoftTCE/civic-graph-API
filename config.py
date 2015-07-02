import os

basedir = os.path.abspath(os.path.dirname(__file__))

#SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'civic.db')
SQLALCHEMY_DATABASE_URI = 'mysql+mysqldb://root:LimeGreenChick3nWings@localhost/civicgraph'
SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository')
PROPAGATE_EXCEPTIONS = True
