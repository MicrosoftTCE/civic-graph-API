# Check if Entity exists.
from models import Entity, Category, Keyperson, Revenue, Expense, Funding, Investment, Relation, Finance, Financeconnection, Dataconnection, Connection, Collaboration, Employment, Relation
from database import db

def update(entity, data):
    # Check if data has changed item-by-item.
    # Instead, just use IDs and send only changes on the frontend, please.
    if entity.name != data['name']:
        entity.name = data['name']
    if entity.nickname != data['nickname']:
        entity.nickname = data['nickname']
    #if entity.location != data['location']:
    #    entity.location = data['location']
    if entity.entitytype != data['type']:
        entity.entitytype = data['type']
    if entity.influence != data['influence']:
        entity.influence = data['influence']
    if entity.employees != data['employees']:
        entity.employees = data['employees']
    if entity.url != data['url']:
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
                    print 'UPDATING ' + ftype + ' AMOUNT: ' + str(oldfinance.amount)
                if oldfinance.year != finance['year']:
                    oldfinance.year = finance['year']
                    print 'UPDATING ' + ftype + ' YEAR: ' + str(oldfinance.year)
            else:
                # Finance doesn't exist, create it.
                if ftype is 'revenues':
                    revenue = Revenue(finance['amount'], finance['year'])
                    entity.revenues.append(revenue)
                    print 'NEW REVENUE -- ' + str(revenue.year) + ': ' + str(revenue.amount)
                elif ftype is 'expenses':
                    expense = Expense(finance['amount'], finance['year'])
                    entity.expenses.append(expense)
                    print 'NEW EXPENSE -- ' + str(expense.year) + ': ' + str(expense.amount)

    update_finance(data['revenues'], 'revenues')
    update_finance(data['expenses'], 'expenses')

    def update_key_people(key_people):
        # Delete any key people who have been removed.
        # TODO: Check for names too, in case you're getting an id from an old cleared form field.
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
                    print 'UPDATED KEY PERSON NAME ' + keyperson.name
            else:
                # Key person doesn't exist, create them.
                keyperson = Keyperson(key_person['name'])
                entity.key_people.append(keyperson)
                print 'NEW KEY PERSON ' + keyperson.name

    update_key_people(data['key_people'])

    def update_categories(categories):
        # Add any new categories.
        for category in categories:
            if category['id']:
                cat = Category.query.get(category['id'])
                if cat not in entity.categories:
                    print 'ADDING CATEGORY ' + cat.name
                    entity.categories.append(cat)
        # Delete any categories that have been removed.
        new_categories = [category['id'] for category in categories]
        for category in entity.categories:
            if category.id not in new_categories:
                print 'REMOVING CATEGORY ' + category.name
                entity.categories.remove(category)
                
    update_categories(data['categories'])

    def update_financeconnections(connections, ftype, direction):
        # TODO: Delete old connections
        for connection in connections:
            if connection['id']:
                # Connection exists, update amount and year.
                oldconnection = Financeconnection.query.get(connection['id'])
                if oldconnection.amount != connection['amount']:
                    oldconnection.amount = connection['amount']
                    print 'UPDATING ' + ftype + ' AMOUNT: ' + str(oldconnection.amount)
                if oldconnection.year != connection['year']:
                    oldconnection.year = connection['year']
                    print 'UPDATING ' + ftype + ' YEAR: ' + str(oldconnection.year)
            else:
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
                elif ftype is 'funding':
                    newconnection = Funding(connection['amount'], connection['year'])
                    if direction is 'given':
                        entity.funding_given.append(newconnection)
                        otherentity.funding_received.append(newconnection)
                    elif direction is 'received':
                        entity.funding_received.append(newconnection)
                        otherentity.funding_given.append(newconnection)
    update_financeconnections(data['funding_given'], 'funding', 'given')
    update_financeconnections(data['funding_received'], 'funding', 'received')
    update_financeconnections(data['investments_made'], 'investment', 'given')
    update_financeconnections(data['investments_received'], 'investment', 'received')

    def update_dataconnections(connections, direction):
        # TODO: Delete old connections.
        for connection in connections:
            if connection['id']:
                oldconnection = Dataconnection.query.get(connection['id'])
                if oldconnection.details != connection['details']:
                    oldconnection.details = connection['details']
            else:
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

    update_dataconnections(data['data_given'], 'given')
    update_dataconnections(data['data_received'], 'received')

    def update_connections(connections, ctype):
        # TODO: Delete old connections.
        for connection in connections:
            if connection['id']:
                # Connection exists, update details.
                oldconnection = Connection.query.get(connection['id'])
                if oldconnection.details != connection['details']:
                    oldconnection.details = connection['details']
                    print 'UPDATING CONNECTION DETAILS', oldconnection.details
            else:
                otherentity = Entity.query.get(connection['entity_id'])
                if ctype is 'collaborations':
                    collaboration = Collaboration(entity, otherentity, connection['details'])
                    print 'CREATED NEW COLLABORATION ', collaboration.details
                elif ctype is 'employments':
                    employment = Employment(entity, otherentity, connection['details'])
                    print 'CREATED NEW EMPLOYMENT ', employment.details
                elif ctype is 'relations':
                    relation = Relation(entity, otherentity, connection['details'])
                    print 'CREATED NEW RELATION ', relation.details
                db.commit()

    update_connections(data['collaborations'], 'collaborations')
    update_connections(data['employments'], 'employments')
    update_connections(data['relations'], 'relations')

    db.commit()
