import json
# Check if Entity exists.
from datetime import datetime

from app import app
from app.models import Entity, Category, Keyperson, Revenue, Expense, Grant, Investment, Finance, \
    Fundingconnection, Dataconnection, Connection, Collaboration, Employment, Relation, Location, \
    Edit
from database import db
from app import redis_store


def getEventEntities(eventName):
    return [json.loads(x) for x in redis_store.smembers(eventName + '.entity')]

def getEventConnections(eventName):
    return {key: json.loads(value) for key, value in redis_store.hgetall(eventName + '.connection').iteritems()}

def setEventData(eventName, entity):
    entityID = getIncEntityID(eventName)
    entity['id'] = entityID
    oldConnections = getEventConnections(eventName)
    # app.logger.debug(oldConnections)
    oldConnections['Funding'] = ([] if 'Funding' not in oldConnections else oldConnections['Funding'])
    oldConnections['Data'] = ([] if 'Data' not in oldConnections else oldConnections['Data'])
    oldConnections['Collaboration'] = ([] if 'Collaboration' not in oldConnections else oldConnections['Collaboration'])
    oldConnections['Employment'] = ([] if 'Employment' not in oldConnections else oldConnections['Employment'])
    connections = {
        "Funding": json.dumps(fundingConversion(entity) + oldConnections['Funding']),
        "Data": json.dumps(dataConversion(entity) + oldConnections['Data']),
        "Collaboration": json.dumps(collaborationConversion(entity) + oldConnections['Collaboration']),
        "Employment": json.dumps(employmentConversion(entity) + oldConnections['Employment'])
    }
    app.logger.debug(connections)
    redis_store.hmset(eventName + '.connection', connections)
    redis_store.sadd(eventName + '.entity', json.dumps(entity))
    return getEventEntities(eventName)

def getIncEntityID(eventName):
    ID = redis_store.get(eventName + '.entityID')
    if ID is None:
        redis_store.set(eventName + '.entityID', 1)
        ID = 1
    redis_store.incr(eventName + '.entityID')
    return int(ID)

def collaborationConversion(data):
    return [{"source": data['id'], "target": f['entity_id']} for f in data['collaborations']]

def fundingConversion(data):
    return [{"source": data['id'], "target": f['entity_id']} for f in data['investments_received']]

def dataConversion(data):
    return [{"source": data['id'], "target": f['entity_id']} for f in data['data_received']]

def employmentConversion(data):
    return [{"source": data['id'], "target": f['entity_id']} for f in data['employments']]


def update(entity, data):
    # Check if data has changed item-by-item.
    # Instead, just use IDs and send only changes on the frontend, please.
    if entity.name != data['name']:
        entity.name = data['name']
    if entity.nickname != data['nickname']:
        entity.nickname = data['nickname']
    # if entity.description != data['description']:
    #     entity.description = data['description']
    if entity.entitytype != data['type']:
        entity.entitytype = data['type']
    if entity.influence != data['influence']:
        entity.influence = data['influence']
    if entity.employees != data['employees']:
        entity.employees = data['employees']
    if entity.url != data['url']:
        if 'http' not in data['url']:
            data['url'] = 'http://' + data['url']
        entity.url = data['url']
    if entity.twitter_handle != data['twitter_handle']:
        entity.twitter_handle = data['twitter_handle']

    def update_finance(finances, ftype):
        # Delete any finances which have been removed.
        new_finances = [finance['id'] for finance in finances if finance['id']]
        if ftype == 'revenues':
            entity.revenues = [revenue for revenue in entity.revenues if revenue.id in new_finances]
        elif ftype == 'expenses':
            entity.expenses = [expense for expense in entity.expenses if expense.id in new_finances]

        # Do this or else list comprehensions don't work as expected.
        db.commit()

        # Create or update.
        for finance in finances:
            if finance['id']:
                # Finance exists, update data.
                oldfinance = Finance.query.get(finance['id'])
                if oldfinance.amount != finance['amount']:
                    oldfinance.amount = finance['amount']
                    app.logger.debug('UPDATING ' + ftype + ' AMOUNT: ' + str(oldfinance.amount))
                if oldfinance.year != finance['year']:
                    oldfinance.year = finance['year']
                    app.logger.debug('UPDATING ' + ftype + ' YEAR: ' + str(oldfinance.year))
            else:
                # Finance doesn't exist, create it.
                if ftype is 'revenues':
                    revenue = Revenue(finance['amount'], finance['year'])
                    entity.revenues.append(revenue)
                    app.logger.debug(
                        'NEW REVENUE -- ' + str(revenue.year) + ': ' + str(revenue.amount))
                elif ftype is 'expenses':
                    expense = Expense(finance['amount'], finance['year'])
                    entity.expenses.append(expense)
                    app.logger.debug(
                        'NEW EXPENSE -- ' + str(expense.year) + ': ' + str(expense.amount))
        db.commit()

    update_finance(data['revenues'], 'revenues')
    update_finance(data['expenses'], 'expenses')

    def update_key_people(key_people):
        # Delete any key people who have been removed.
        # TODO: Check for names too, in case you're getting an id from an old cleared form field.
        # TODO: Make sure they're deleted from the db and not just removed from entity.key_people.
        new_keypeople = [key_person['id'] for key_person in key_people if key_person['id']]
        entity.key_people = [key_person for key_person in entity.key_people if
                             key_person.id in new_keypeople]

        # Do this or else list comprehensions don't work as expected.
        db.commit()

        # Create or update.
        for key_person in key_people:
            if key_person['id']:
                # Key person exists, update their name.
                keyperson = Keyperson.query.get(key_person['id'])
                if keyperson.name != key_person['name']:
                    keyperson.name = key_person['name']
                    app.logger.debug('UPDATED KEY PERSON NAME ' + keyperson.name)
            else:
                # Key person doesn't exist, create them.
                keyperson = Keyperson(key_person['name'])
                entity.key_people.append(keyperson)
                app.logger.debug('NEW KEY PERSON ' + keyperson.name)
        db.commit()

    update_key_people(data['key_people'])

    def update_edit(ip, e_type):
        edit = Edit(ip)
        edit.entity_id = entity.id
        edit.edit_type = e_type
        edit.edit_time = datetime.utcnow()
        db.add(edit)
        db.commit()

    update_edit(data["ip"], data["edit_type"])

    def update_categories(categories):
        # Add any new categories.
        for category in categories:
            if category['id']:
                cat = Category.query.get(category['id'])
                if cat not in entity.categories:
                    app.logger.debug('ADDING CATEGORY ' + cat.name)
                    entity.categories.append(cat)
        # Delete any categories that have been removed.
        new_categories = [category['id'] for category in categories]
        for category in entity.categories:
            if category.id not in new_categories:
                app.logger.debug('REMOVING CATEGORY ' + category.name)
                entity.categories.remove(category)
        db.commit()

    update_categories(data['categories'])

    def update_fundingconnections(connections, ftype, direction):
        # Delete and connections that have been removed.
        new_connections = [connection['id'] for connection in connections if connection['id']]
        # TODO: See if you can make this generic to handle any set of connections for simplicity.
        # TODO: Maybe list comprehensions in stead depending on how cascade='delete-orphan' works.
        if ftype is 'investment':
            if direction is 'given':
                for connection in entity.investments_made:
                    if connection.id not in new_connections:
                        db.delete(connection)
            elif direction is 'received':
                for connection in entity.investments_received:
                    if connection.id not in new_connections:
                        db.delete(connection)
        elif ftype is 'grant':
            if direction is 'given':
                for connection in entity.grants_given:
                    if connection.id not in new_connections:
                        db.delete(connection)
            elif direction is 'received':
                for connection in entity.grants_received:
                    if connection.id not in new_connections:
                        db.delete(connection)
        db.commit()

        for connection in connections:
            if connection['id']:
                # Connection exists, update amount and year.
                oldconnection = Fundingconnection.query.get(connection['id'])
                if oldconnection.amount != connection['amount']:
                    oldconnection.amount = connection['amount']
                    app.logger.debug('UPDATING ' + ftype + ' AMOUNT: ' + str(oldconnection.amount))
                if oldconnection.year != connection['year']:
                    oldconnection.year = connection['year']
                    app.logger.debug('UPDATING ' + ftype + ' YEAR: ' + str(oldconnection.year))
            elif 'entity_id' in connection:
                # Connection doesn't exist, create it connect entities.
                otherentity = Entity.query.get(connection['entity_id'])
                if ftype is 'investment':
                    newconnection = Investment(connection['amount'], connection['year'])
                    if direction is 'given':
                        entity.investments_made.append(newconnection)
                        otherentity.investments_received.append(newconnection)
                    elif direction is 'received':
                        entity.investments_received.append(newconnection)
                        otherentity.investments_made.append(newconnection)
                elif ftype is 'grant':
                    newconnection = Grant(connection['amount'], connection['year'])
                    if direction is 'given':
                        entity.grants_given.append(newconnection)
                        otherentity.grants_received.append(newconnection)
                    elif direction is 'received':
                        entity.grants_received.append(newconnection)
                        otherentity.grants_given.append(newconnection)
        db.commit()

    update_fundingconnections(data['grants_given'], 'grant', 'given')
    update_fundingconnections(data['grants_received'], 'grant', 'received')
    update_fundingconnections(data['investments_made'], 'investment', 'given')
    update_fundingconnections(data['investments_received'], 'investment', 'received')

    def update_dataconnections(connections, direction):
        # Delete any connections that have been removed.
        new_connections = [connection['id'] for connection in connections if connection['id']]
        # Watch out for odd behavior in list iteration while deleting.
        if direction is 'given':
            for connection in entity.data_given:
                if connection.id not in new_connections:
                    db.delete(connection)
        elif direction is 'received':
            for connection in entity.data_received:
                if connection.id not in new_connections:
                    db.delete(connection)
        db.commit()

        for connection in connections:
            if connection['id']:
                oldconnection = Dataconnection.query.get(connection['id'])
                if oldconnection.details != connection['details']:
                    oldconnection.details = connection['details']
            elif 'entity_id' in connection:
                otherentity = Entity.query.get(connection['entity_id'])
                newconnection = Dataconnection()
                if connection['details']:
                    newconnection.details = connection['details']
                if direction is 'given':
                    entity.data_given.append(newconnection)
                    otherentity.data_received.append(newconnection)
                elif direction is 'received':
                    entity.data_received.append(newconnection)
                    otherentity.data_given.append(newconnection)
        db.commit()

    update_dataconnections(data['data_given'], 'given')
    update_dataconnections(data['data_received'], 'received')

    def update_connections(connections, ctype):
        # Delete any connections that have been removed.
        new_connections = [connection['id'] for connection in connections if connection['id']]
        # Watch out for odd behavior in list iteration while deleting.
        if ctype is 'collaborations':
            for connection in entity.collaborations:
                if connection.id not in new_connections:
                    db.delete(connection)
        elif ctype is 'employments':
            for connection in entity.employments:
                if connection.id not in new_connections:
                    db.delete(connection)
        # elif ctype is 'relations':
        #     for connection in entity.relations:
        #         if connection.id not in new_connections:
        #             db.delete(connection)
        db.commit()

        for connection in connections:
            if connection['id']:
                # Connection exists, update details.
                oldconnection = Connection.query.get(connection['id'])
                if oldconnection.details != connection['details']:
                    oldconnection.details = connection['details']
                    app.logger.debug('UPDATING CONNECTION DETAILS', oldconnection.details)
            elif 'entity_id' in connection:
                otherentity = Entity.query.get(connection['entity_id'])
                if ctype is 'collaborations':
                    collaboration = Collaboration(entity, otherentity, connection['details'])
                    app.logger.debug('CREATED NEW COLLABORATION ', collaboration.details)
                elif ctype is 'employments':
                    employment = Employment(entity, otherentity, connection['details'])
                    app.logger.debug('CREATED NEW EMPLOYMENT ', employment.details)
                elif ctype is 'relations':
                    relation = Relation(entity, otherentity, connection['details'])
                    app.logger.debug('CREATED NEW RELATION ', relation.details)
        db.commit()

    update_connections(data['collaborations'], 'collaborations')
    update_connections(data['employments'], 'employments')
    # update_connections(data['relations'], 'relations')

    def update_locations(locations):
        # Delete old locations.
        # TODO: See if this actually deletes them from db or just removes them from entity.locations.
        # See: cascade='delete-orphan'

        # Check to see if location has an id, then check to see if id is null
        # If ID not null, add to list
        new_locations = [location['id'] for location in locations if ('id' in location and location['id'])]
        entity.locations = [location for location in entity.locations if
                            location.id in new_locations]

        # Do this or else list comprehensions don't work as expected.
        db.commit()

        def update_location(location, json):
            location.address_line = json['address_line'] if 'address_line' in json else None
            location.locality = json['locality'] if 'locality' in json else None
            location.district = json['district'] if 'district' in json else None
            location.postal_code = json['postal_code'] if 'postal_code' in json else None
            location.country = json['country'] if 'country' in json else None
            location.country_code = json['country_code'] if 'country_code' in json else None
            if 'coordinates' in json and not json['coordinates'] is None:
                location.latitude = json['coordinates'][0]
                location.longitude = json['coordinates'][1]
            else:
                location.latitude = None
                location.longitude = None

            if entity.entitytype == 'Individual':
                location.address_line = None
                location.postal_code = None
                location.latitude = None
                location.longitude = None
                app.logger.debug("********************\n%s\n********************", location)
            db.commit()

        for location in locations:
            if 'id' in location and location['id']:
                # Location exists, update.
                oldlocation = Location.query.get(location['id'])
                update_location(oldlocation, location)
            else:
                app.logger.debug(
                    "********************\nThis should not happen\n********************")
                # Create new location.
                newlocation = Location()
                update_location(newlocation, location)
                entity.locations.append(newlocation)
                app.logger.debug('ADDED NEW LOCATION %s', newlocation)

        db.commit()

    update_locations(data['locations'])

    db.commit()
