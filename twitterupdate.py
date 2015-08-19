import time
import twitter
from app.models import Entity
from database import db
from secrets import consumer_key, consumer_secret, access_token, access_token_secret

entities = Entity.query.filter(Entity.twitter_handle!=None).all()

api = twitter.Api(consumer_key=consumer_key,
                    consumer_secret=consumer_secret,
                    access_token_key=access_token,
                    access_token_secret=access_token_secret)

for entity in entities:
    twitter_handle = entity.twitter_handle.strip('@ ')
    if len(twitter_handle) > 0:
        try:
            time.sleep(6)
            user = api.GetUser(screen_name=twitter_handle)
            followers = user.followers_count
            if followers:
                print entity.name
                print followers
                entity.followers = followers
        except:
            print 'ERROR', entity.name

db.commit()
