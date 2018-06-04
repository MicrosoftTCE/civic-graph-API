import sys

sitepackage = "D:\home\site\wwwroot\env\Lib\site-packages"
appstuff = "D:\home\site\wwwroot"
sys.path.append(sitepackage)
sys.path.append(appstuff)

import time
import twitter
from app.models import Entity
from database import db
from config import environ_get
from app import cache
from app import app
from app import redis_store
entities = Entity.query.filter(Entity.twitter_handle!=None).all()
api = twitter.Api(environ_get('consumer_key'),
                  environ_get('consumer_secret'),
                  environ_get('access_token_key'),
                  environ_get('access_token_secret'))
x = 0
for entity in entities:
    twitter_handle = entity.twitter_handle.strip('@')
    if len(twitter_handle) > 0:
        try:
            user = api.GetUser(screen_name=twitter_handle)
            followers = user.followers_count
            description = user.description
            if followers:
                #print entity.name, '; Actual: ', followers, '; Stored: ', entity.followers
				entity.followers = followers
            if description:
                entity.description = description
        except:
            print 'ERROR'
    x = x+1
    if (x % 100 == 0):
        db.commit()
db.commit()
redis_store.flushdb()

#This file should be added as a "webjob" to Azure with a scheduled time to run. I have it scheduled to run daily at 3am, Eastern