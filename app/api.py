# Check if Entity exists.
from models import Entity, Category, Keyperson, Revenue, Expense, Funding, Investment, Relation

def update(entity, data):
    # Check if data has changed item-by-item.
    # Instead, just use IDs and send only changes on the frontend, please.
    print data.keys()
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
    # Revenues
    # Expenses
    # Funding Given
    # Funding Received
    # Investments Given
    # Investments Received
    # Data
    # Collaboration
    # Relation?
    """
    if data['funding_received']:
        for funding_received in data['funding_received']:
            #TODO: Just use IDs, then you don't have to worry about all this querying
            # or edge cases like just updating the year on previous funding.
            
            # Find if this entity has given funds before.
            funder = Entity.query.filter(Entity.name==funding_received['name']).first()
            previously_received = funding_received.filter(Funding.giver==funder).all()
            
            if not previously_received:
                # This funder has not funded this entity before.
                newfunding = Funding(funding_received['amount'], funding_received['year'])
                entity.funding_received.append(newfunding)
                funder.funding_given.append(newfunding)
            else:
                # This funder has funded this entity before. Update by year,
                # or create a new year/funding pair.
                year = funding_received['year']
                previous_funding = previously_received.filter(Funding.year==year).first()
                if previous_funding:
                    # Year exists, update amount for that year.
                    # Could overwrite amount values for null years.
                    # May cause issues with multiple fundings from same funder for null years.
                    previous_funding.amount = funding_received['amount']
                else:
                    # Year does not exist, create new Funding for this year.
                    newfunding = Funding(funding_received['amount'], funding_received['year'])
                    entity.funding_received.append(newfunding)
                    funder.funding_given.append(newfunding)
    """