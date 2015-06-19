#!/usr/bin/env python
import json
import requests
import os
from app import db
from app.models import Entity, Category, Keyperson, Revenue, Expense, Grant, Investment, Relation, Dataconnection, Collaboration, Location
from database import init_db
import time

if os.path.exists('civic.db'):
    os.remove('civic.db')
    init_db()

with open('civic.json') as f:
    rawdata = json.loads(f.read())

#with open('cities.json') as f:
#    cities = json.loads(f.read())['nodes']

# Map old and new IDs to transfer connections
# You'll have to catch some manually because civic.json is broken
# -- some IDs reference un-rendered versions of nodes.
old_to_new = {}

connections = {}
connections['collaborations'] = rawdata['collaboration_connections']
connections['data'] = rawdata['data_connections']
connections['funding'] = rawdata['funding_connections']
connections['investment'] = rawdata['investment_connections']
nodes = rawdata['nodes']

def filter_connections(connections):
    # Remove nodes that aren't rendered.
    filtered = [connection for connection in connections if connection['render'] == 1]
    for connection in filtered:
        del connection['render']
    return filtered

def create_categories():
    # Create all unique categories in the db.
    categories = set()
    for node in nodes:
        if node['categories']:
            categories.update(node['categories'])

    categories = [category for category in categories if len(category) > 2]
    for name in categories:
        category = Category(name)
        db.add(category)

    db.commit()

def categorize(entity, categories):
    # Assign an entity its categories.
    if categories:
        for c in categories:
            category = Category.query.filter_by(name=c).first()
            if category:
                entity.categories.append(category)
"""
def create_cities():
    if cities:
        for c in cities:
            location = Location(c['city_name'], c['state_code'], c['state_name'], 
                c['country_code'], c['country_name'], c['city_lat'], c['city_long'])
            db.add(location)

        db.commit()
"""
def create_key_people():
    # Create all key_people in the db.
    key_people = set()
    for node in nodes:
        if node['key_people']:
            for kp in node['key_people']:
                key_people.add(kp['name'])

    key_people = list(key_people)
    for person in key_people:
        key_person = Keyperson(person)
        db.add(key_person)

    db.commit()

def connect_key_people(entity, keypeople):
    # Assign an entity its key_people.
    if keypeople:
        for person in keypeople:
            key_person = Keyperson.query.filter_by(name=person['name']).first()
            entity.key_people.append(key_person)
# Do this manually because civic.json only gives names.
# Unless you filter by name, check relations, and add if it isn't in.
"""
def create_relations():
    # Create relation things in the db.
    relations = set()
    for node in nodes:
        if node['relations']:
            for r in node['relations']:
                relations.add(r['entity'])

    relations = list(relations)
    for name in relations:
        relation = Relation(name)
        db.add(relation)

    db.commit()


def add_relations(entity, relations):
    if relations:
        for r in relations:
            relation = Relation.query.filter_by(name=r['entity']).first()
            entity.relations.append(relation)
"""

def add_finances(entity, finances, ftype):
    # Add revenues and expenses to an entity.
    if finances:
        for f in finances:
            if ftype == 'revenue':
                years = [r.year for r in entity.revenues]
                if f['year'] not in years:
                    # Add only if year doesn't exist to avoid duplicates.
                    revenue = Revenue(f['amount'], f['year'])
                    entity.revenues.append(revenue)
                    db.flush()
                else:
                    # Update amount if year exists.
                    oldrevenue = entity.revenues.filter_by(year=f['year']).first()
                    if oldrevenue: oldrevenue.amount = f['amount']
            elif ftype == 'expenses':
                years = [e.year for e in entity.expenses]
                if f['year'] not in years:
                    # Add only if year doesn't exist to avoid duplicates.
                    expense = Expense(f['amount'], f['year'])
                    entity.expenses.append(expense)
                    db.flush()
                else:
                    # Update amount if year exists.
                    oldexpense = entity.expenses.filter_by(year=f['year']).first()
                    if oldexpense: oldexpense.amount = f['amount']

def add_location(entity, locationtext):

    def query(location):
        url = 'http://dev.virtualearth.net/REST/v1/Locations'
        params = {'query': location, 'key': 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD', 'incl': 'ciso2'}
        r = requests.get(url, params=params)
        responsedata = json.loads(r.text)
        return responsedata['resourceSets'][0]['resources']
    if locationtext:
        locations = locationtext.split(';')
        for location in locations:
            tries = 0
            time.sleep(0.1)

            resources = query(location)
            while len(resources) == 0 and tries < 20:
                #print 'NO RESULTS FOR ' + location + ' TRYING AGAIN'
                resources = query(location)
                tries+=1

            if len(resources):
                locationdata = resources[0]
                newlocation = Location()
                if 'formattedAddress' in locationdata['address']:
                    newlocation.full_address = locationdata['address']['formattedAddress']
                if 'addressLine' in locationdata['address']:
                    newlocation.address_line = locationdata['address']['addressLine']
                if 'locality' in locationdata['address']:
                    newlocation.locality = locationdata['address']['locality']
                if 'adminDistrict' in locationdata['address']:
                    newlocation.district = locationdata['address']['adminDistrict']
                if 'postalCode' in locationdata['address']:
                    newlocation.postal_code = locationdata['address']['postalCode']
                if 'countryRegion' in locationdata['address']:
                    newlocation.country = locationdata['address']['countryRegion']
                if 'countryRegionIso2' in locationdata['address']:
                    newlocation.country_code = locationdata['address']['countryRegionIso2']
                if 'point' in locationdata:
                    newlocation.latitude = locationdata['point']['coordinates'][0]
                    newlocation.longitude = locationdata['point']['coordinates'][1]
                entity.locations.append(newlocation)
                db.flush()
                #print 'GOT LOCATION FOR ', location
            else:
                print 'NO DATA FOUND FOR ' + location + ' ' + entity.name + ' ' + str(entity.id)
                print responsedata['resourceSets']

def connect(connections, ctype):
    if connections:
        for connection in connections:
            try:
                source = Entity.query.filter_by(id=old_to_new[connection['source']]).first()
                target = Entity.query.filter_by(id=old_to_new[connection['target']]).first()
                if ctype == 'collaborations':
                    collaboration = Collaboration(source, target)
                elif ctype == 'data':
                    dataconnection = Dataconnection()
                    source.data_received.append(dataconnection)
                    target.data_given.append(dataconnection)
            except KeyError as e:
                # Some IDs in civic.json aren't rendered... 
                # Point to them manually.
                print "Failed to find ID: ", e
            except AttributeError as e:
                print "Failed on connection:"
                print connection

def connect_finance(connections, ftype):
    if connections:
        for finance in connections:
            try:
                source = Entity.query.filter_by(id=old_to_new[finance['source']]).first()
                target = Entity.query.filter_by(id=old_to_new[finance['target']]).first()
                if ftype == 'funding':
                    grant = Grant(finance['amount'], finance['year'])
                    # Odd civic.json convention of source/target "received"
                    source.grants_received.append(grant)
                    target.grants_given.append(grant)
                elif ftype == 'investment':
                    investment = Investment(finance['amount'], finance['year'])
                    # Odd civic.json convention of source/target "received"
                    source.investments_received.append(investment)
                    target.investments_made.append(investment)
            except KeyError as e:
                # Some IDs in civic.json aren't rendered... 
                # Point to them manually.
                print "Failed to find ID: ", e

def make_connections():
    # Make all data/collaboration/finance connections.
    connect(connections['collaborations'], 'collaborations')
    connect(connections['data'], 'data')
    connect_finance(connections['investment'], 'investment')
    connect_finance(connections['funding'], 'funding')

def create_entity(node):
    entity = Entity(node['name'])
    entity.nickname = node['nickname']
    
    entity.entitytype = node['type']
    entity.influence = node['influence']
    if entity.influence:
        entity.influence = entity.influence.capitalize()
    entity.employees = node['employees']
    entity.url = node['url']
    entity.twitter_handle = node['twitter_handle']
    entity.followers = node['followers']
    categorize(entity, node['categories'])
    add_finances(entity, node['revenue'], 'revenue')
    add_finances(entity, node['expenses'], 'expenses')
    #add_relations(entity, node['relations'])
    connect_key_people(entity, node['key_people'])
    db.add(entity)
    db.flush()
    add_location(entity, node['location'])
    old_to_new[node['ID']] = entity.id

# Remove connections and nodes that aren't rendered.
for category, all_connections in connections.items():
    connections[category] = filter_connections(all_connections)   
nodes = filter_connections(nodes)

print "Read %d nodes." % len(nodes)

# Create all unique categories in the db.
create_categories()

# Create all key_people in the db.
create_key_people()

# Create all relations in the db.
# create_relations()

# Create all cities in the db.
#create_cities()

for node in nodes:
    create_entity(node)
    
# Manually defining IDs broken in civic.json...
old_to_new[289] = old_to_new[902] # New York Tech Meetup
old_to_new[541] = old_to_new[552] # Open Government Partnership

# Make all connections between entities.
make_connections()

db.commit()

print "Wrote %d Entity entries." % len(Entity.query.all())
print "Wrote %d Category entries." % len(Category.query.all())
print "Wrote %d Location entries." % len(Location.query.all())
print "Wrote %d Keyperson entries." % len(Keyperson.query.all())
print "Wrote %d Revenue entries." % len(Revenue.query.all())
print "Wrote %d Expense entries." % len(Expense.query.all())
print "Wrote %d Grant entries." % len(Grant.query.all())
print "Wrote %d Investment entries." % len(Investment.query.all())
print "Wrote %d Dataconnection entries." % len(Dataconnection.query.all())
print "Wrote %d Relation entries." % len(Relation.query.all())
print "Wrote %d Collaboration entries." % len(Collaboration.query.all())