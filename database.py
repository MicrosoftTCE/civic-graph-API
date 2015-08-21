from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from config import SQLALCHEMY_DATABASE_URI

engine = create_engine(SQLALCHEMY_DATABASE_URI, convert_unicode=True, pool_recycle=3600)
db = scoped_session(sessionmaker(autocommit=False,
                                autoflush=False,
                                bind=engine))

Base = declarative_base()

Base.query = db.query_property()

def init_db():
    import app.models
    Base.metadata.create_all(bind=engine)
