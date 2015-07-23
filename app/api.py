# Check if Entity exists.
from models import Entity, Category, Keyperson, Revenue, Expense, Grant, Investment, Relation, Finance, Fundingconnection, Dataconnection, Connection, Collaboration, Employment, Relation, Location
from database import db
from app import app

def update(entity, data):
    # Check if data has changed item-by-item.
    # Instead, just use IDs and send only changes on the frontend, please.
    if entity.name != data['name']:
        entity.name = data['name']
    if entity.nickname != data['nickname']:
        entity.nickname = data['nickname']
    if entity.entitytype != data['type']:
        entity.entitytype = data['type']
    if entity.influence != data['influence']:
        entity.influence = data['influence']
    if entity.employees != data['employees']:
        entity.employees = data['employees']
    if entity.url != data['url']:
        if 'http' not in data['url']:
            data['url'] = 'http://'+data['url']
        entity.url = data['url']
    if entity.twitter_handle != data['twitter_handle']:
        entity.twitter_handle = data['twitter_handle']
        # Pull entity.followers from Twitter API.

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
                    app.logger.debug('NEW REVENUE -- ' + str(revenue.year) + ': ' + str(revenue.amount))
                elif ftype is 'expenses':
                    expense = Expense(finance['amount'], finance['year'])
                    entity.expenses.append(expense)
                    app.logger.debug('NEW EXPENSE -- ' + str(expense.year) + ': ' + str(expense.amount))
        db.commit()

    update_finance(data['revenues'], 'revenues')
    update_finance(data['expenses'], 'expenses')

    def update_key_people(key_people):
        # Delete any key people who have been removed.
        # TODO: Check for names too, in case you're getting an id from an old cleared form field.
        # TODO: Make sure they're deleted from the db and not just removed from entity.key_people.
        new_keypeople = [key_person['id'] for key_person in key_people if key_person['id']]
        entity.key_people = [key_person for key_person in entity.key_people if key_person.id in new_keypeople]
        
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
        elif ctype is 'relations':
            for connection in entity.relations:
                if connection.id not in new_connections:
                    db.delete(connection)
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
    update_connections(data['relations'], 'relations')

    def update_locations(locations):
        # Delete old locations.
        # TODO: See if this acutally deletes them from db or just removes them from entity.locations.
        # See: cascade='delete-orphan'
        new_locations = [location['id'] for location in locations if location['id']]
        entity.locations = [location for location in entity.locations if location.id in new_locations]
        
        # Do this or else list comprehensions don't work as expected.
        db.commit()

        def update_location(location, json):
            location.full_address = json['full_address'] if 'full_address' in json else None
            location.address_line = json['address_line'] if 'address_line' in json else None
            location.locality = json['locality'] if 'locality' in json else None
            location.district = json['district'] if 'district' in json else None
            location.postal_code = json['postal_code'] if 'postal_code' in json else None
            location.country = json['country'] if 'country' in json else None
            location.country_code = json['country_code'] if 'country_code' in json else None
            location.latitude = json['coordinates'][0] if 'coordinates' in json else None
            location.longitude = json['coordinates'][1] if 'coordinates' in json else None
            if entity.entitytype is 'Individual':
                location.full_address = location.locality + ', ' + location.district if location.locality and location.district else location.locality if location.locality else location.country

        for location in locations:
            if location['id']:
                # Location exists, update.
                oldlocation = Location.query.get(location['id'])
                if oldlocation.full_address != location['full_address']:
                    # If the full address has changed, everything has changed.
                    update_location(oldlocation, location)
            else:
                # Create new location.
                newlocation = Location()
                update_location(newlocation, location)
                entity.locations.append(newlocation)
                app.logger.debug('ADDED NEW LOCATION', newlocation)
        db.commit()

    update_locations(data['locations'])

    db.commit()
