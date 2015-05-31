# Check if Entity exists.
from models import Entity, Category, Keyperson, Revenue, Expense, Funding, Investment, Relation, Finance
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

    # Funding Given
    # Funding Received
    # Investments Made
    # Investments Received
    # Data Given
    # Data Received
    # Collaboration
    # Relation?