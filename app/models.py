from sqlalchemy import Table, Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship, backref
from database import Base

category_table = Table('category_table', Base.metadata,
    Column('category_id', Integer, ForeignKey('category.id')),
    Column('entity_id', Integer, ForeignKey('entity.id'))
)

collaboration_table = Table('collaboration_table', Base.metadata,
    Column('entity_id1', Integer, ForeignKey('entity.id')),
    Column('entity_id2', Integer, ForeignKey('entity.id'))
)

relation_table = Table('relation_table', Base.metadata,
    Column('relation_id', Integer, ForeignKey('relation.id')),
    Column('entity_id', Integer, ForeignKey('entity.id'))
)

# Make this a connection to entities rather than a 'Key Person'.
keypeople_table = Table('keypeople_table', Base.metadata,
    Column('keyperson_id', Integer, ForeignKey('keyperson.id')),
    Column('entity_id', Integer, ForeignKey('entity.id'))
)

"""
collaboration_table = Table('collaboration_table', Base.metadata,
    Column('collaboration_id', Integer, ForeignKey('collaboration.id')),
    Column('entity_id', Integer, ForeignKey('entity.id'))
)
"""
class Entity(Base):
    __tablename__ = 'entity'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    nickname = Column(String(100))
    location = Column(String(100))
    #locations = relationship('Location', secondary=location_table,
    #                            backref=backref('entity', lazy='dynamic'))
    entitytype = Column(String(100))
    categories = relationship('Category', secondary=category_table, 
                                backref=backref('entity', lazy='dynamic'))
    influence = Column(String(100))
    employees = Column(Integer)
    url = Column(String(100))
    twitter_handle = Column(String(100))
    followers = Column(Integer)
    revenues = relationship('Revenue', backref='entity', lazy='dynamic')
    expenses = relationship('Expense', backref='entity', lazy='dynamic')
    # Try lazy='select'
    funding_given = relationship('Funding', backref='giver', lazy='dynamic',
                        primaryjoin='(Entity.id==Funding.giver_id)')
    funding_received = relationship('Funding', backref='receiver', lazy='dynamic',
                        primaryjoin='(Entity.id==Funding.receiver_id)')
    investments_made = relationship('Investment', backref='giver', lazy='dynamic',
                        primaryjoin='(Entity.id==Investment.giver_id)')
    investments_received = relationship('Investment', backref='receiver', lazy='dynamic',
                        primaryjoin='(Entity.id==Investment.receiver_id)')

    #collaborations = relationship('Collaboration', backref='collaborator', secondary=collaboration_table)
    collaborations = relationship('Entity', backref='collaborator', lazy='dynamic',
                        secondary=collaboration_table,
                        primaryjoin=id==collaboration_table.c.entity_id1,
                        secondaryjoin=id==collaboration_table.c.entity_id2)

    # What even is this?
    relations = relationship('Relation', secondary=relation_table,
                            backref=backref('entity', lazy='dynamic'))
    data_given = relationship('Dataconnection', backref='giver', lazy='dynamic',
                        primaryjoin='(Entity.id==Dataconnection.giver_id)')
    data_received = relationship('Dataconnection', backref='receiver', lazy='dynamic',
                        primaryjoin='(Entity.id==Dataconnection.receiver_id)')
    # Make this a connection to entities rather than a 'Key Person'.
    key_people = relationship('Keyperson', secondary=keypeople_table, 
                            backref=backref('entity', lazy='dynamic'))

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return '<Entity %r>' % (self.name)

    def json(self):
        return {'id': self.id,
                'name': self.name,
                'nickname': self.nickname,
                'locations': [{'location': self.location}],
                'type': self.entitytype,
                'categories': [category.json() for category in self.categories],
                'influence': self.influence,
                'employees': self.employees, 
                'url': self.url,
                'twitter_handle': self.twitter_handle,
                'followers': self.followers,
                'revenues': [revenue.json() for revenue in self.revenues],
                'expenses': [expense.json() for expense in self.expenses],
                'funding_given': [funding.json('given') for funding in self.funding_given],
                'funding_received': [funding.json('received') for funding in self.funding_received],
                'investments_made': [investment.json('given') for investment in self.investments_made],
                'investments_received': [investment.json('received') for investment in self.investments_received],
                #'collaborations': [collaboration.json(self.id) for collaboration in self.collaborations],
                'collaborations': [{'entity': collaboration.name} for collaboration in self.collaborations],
                # Figure out how relations work.
                #'relations': [{'entity': relation.name} for relation in self.relations],
                'data_given': [data.json('given') for data in self.data_given],
                'data_received': [data.json('received') for data in self.data_received],
                'key_people': [person.json() for person in self.key_people]
            }

class Category(Base):
    __tablename__ = 'category'
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    entities = relationship('Entity', secondary=category_table,
                               backref=backref('category', lazy='dynamic'))

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return '<Category %r>' % self.name

    def json(self):
        return {'name': self.name, 'id': self.id}

    def json_all(self):
        return {'name': self.name, 'entities': [entity.json() for entity in entities]}

class Finance(Base):
    __tablename__ = 'finance'
    id = Column(Integer, primary_key=True)
    entity_id = Column(Integer, ForeignKey('entity.id'))
    amount = Column(Float)
    year = Column(Integer)

    discriminator = Column('type', String(50))
    __mapper_args__ = {'polymorphic_on': discriminator}

    def __init__(self, amount, year):
        self.amount = amount
        self.year = year

    def json(self):
        return {'amount': self.amount, 'year': self.year, 'id': self.id}

class Revenue(Finance):
    __mapper_args__ = {'polymorphic_identity': 'revenue'}

class Expense(Finance):
    __mapper_args__ = {'polymorphic_identity': 'expense'}

class Financeconnection(Base):
    __tablename__ = 'financeconnection'
    id = Column(Integer, primary_key=True)
    amount = Column(Float)
    year = Column(Integer)
    giver_id = Column(Integer, ForeignKey('entity.id'))
    receiver_id = Column(Integer, ForeignKey('entity.id'))

    discriminator = Column('type', String(50))
    __mapper_args__ = {'polymorphic_on': discriminator}

    def __init__(self, amount, year):
        self.amount = amount
        self.year = year

    def json(self, direction):
        name = self.receiver.name if direction == 'given' else self.giver.name
        finance_id = self.receiver_id if direction == 'given' else self.giver_id
        return {'amount': self.amount, 'year': self.year, 'entity': name, 'entity_id': finance_id, 'id': self.id}

    def json_connection(self):
        # TODO: Remove connectiontype = Given/Received
        # Should not have to return type since information is contained in source/target.
        connectiontype = 'Received' if self.receiver else 'Given'
        return {'amount': self.amount, 'year': self.year,
                'source': giver_id, 'target': receiver_id, 'type': connectiontype}

class Funding(Financeconnection):
    __mapper_args__ = {'polymorphic_identity': 'funding'}

class Investment(Financeconnection):
    __mapper_args__ = {'polymorphic_identity': 'investment'}

class Directionalconnection(Base):
    __tablename__ = 'directionalconnection'
    id = Column(Integer, primary_key=True)
    details = Column(String(500))
    giver_id = Column(Integer, ForeignKey('entity.id'))
    receiver_id = Column(Integer, ForeignKey('entity.id'))

    discriminator = Column('type', String(50))
    __mapper_args__ = {'polymorphic_on': discriminator}

    def json(self, direction):
        name = self.receiver.name if direction == 'given' else self.giver.name
        entity_id = self.receiver_id if direction == 'given' else self.giver_id
        return {'details': self.details, 'entity': name, 'entity_id': entity_id, 'id': self.id}

    def json_connection(self):
        return {'details': self.details, 'source': giver_id, 'target': receiver_id}

class Dataconnection(Directionalconnection):
    __mapper_args__ = {'polymorphic_identity': 'data'}

"""
class Collaboration(Base):
    __tablename__ = 'collaboration'
    id = Column(Integer, primary_key=True)
    details = Column(String(500))
    entities = relationship('Entity', secondary=collaboration_table,
                               backref=backref('collaboration', lazy='dynamic'))

    def json(self, entityid):
        return {'entities': [{'entity': entity.name} for entity in self.entities if entity.id is not entityid], 'details': self.details, 'id': self.id}
"""


# TODO: Revenue, expense, Funding, Investment should all subclass a single Finance class.
# Possible to subclass a subclass?
# TODO: Connections should subclass a Connection class.

# Make this a connection to entities rather than a 'Key Person'.
class Keyperson(Base):
    __tablename__ = 'keyperson'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    entities = relationship('Entity', secondary=keypeople_table,
                               backref=backref('person', lazy='dynamic'))

    def __init__(self, name):
        self.name = name

    def json(self):
        return {'name': self.name, 'id': self.id}

class Relation(Base):
    __tablename__ = 'relation'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    entities = relationship('Entity', secondary=relation_table,
                                backref=backref('relation', lazy='dynamic'))
    def __init__(self, name):
        self.name = name
