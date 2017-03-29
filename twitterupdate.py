import time
import twitter
from app.models import Entity
from database import db
from config import environ_get

entities = Entity.query.filter(Entity.twitter_handle!=None).all()

api = twitter.Api(environ_get('TWITTER_CONSUMER_KEY'),
                  environ_get('TWITTER_CONSUMER_SECRET'),
                  environ_get('TWITTER_ACCESS_TOKEN'),
                  environ_get('TWITTER_ACCESS_TOKEN_SECRET'))

for entity in entities:
    twitter_handle = entity.twitter_handle.strip('@ ')
    if len(twitter_handle) > 0:
        try:
            time.sleep(6)
            user = api.GetUser(screen_name=twitter_handle)
            followers = user.followers_count
            description = user.description
            if followers:
                print entity.name
                print followers
                entity.followers = followers
            if description:
                print description
                entity.description = description
        except:
            print 'ERROR', entity.name

db.commit()
