from datetime import datetime

from sqlalchemy import Table, Column, Integer, Float, String, ForeignKey, DateTime, event
from sqlalchemy.orm import relationship, backref

from database import Base
from app import cache

category_table = Table('category_table', Base.metadata,
                       Column('category_id', Integer, ForeignKey('category.id')),
                       Column('entity_id', Integer, ForeignKey('entity.id'))
                       )

# Make this a connection to entities rather than a 'Key Person'.
keypeople_table = Table('keypeople_table', Base.metadata,
                        Column('keyperson_id', Integer, ForeignKey('keyperson.id')),
                        Column('entity_id', Integer, ForeignKey('entity.id'))
                        )

location_table = Table('location_table', Base.metadata,
                       Column('location_id', Integer, ForeignKey('location.id')),
                       Column('entity_id', Integer, ForeignKey('entity.id'))
                       )


class Entity(Base):
    __tablename__ = 'entity'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    nickname = Column(String(100))
    description = Column(String(160))
    locations = relationship('Location', secondary=location_table, backref='entity', lazy='dynamic',
                             cascade='all, delete, delete-orphan', single_parent=True)
    entitytype = Column(String(100))
    categories = relationship('Category', secondary=category_table, backref='entity',
                              lazy='dynamic')
    influence = Column(String(100))
    employees = Column(Integer)
    url = Column(String(100))
    twitter_handle = Column(String(100))
    followers = Column(Integer)
    revenues = relationship('Revenue', backref='entity', lazy='dynamic',
                            cascade='all, delete, delete-orphan')
    expenses = relationship('Expense', backref='entity', lazy='dynamic',
                            cascade='all, delete, delete-orphan')
    # Try lazy='select'
    grants_given = relationship('Grant', backref='giver', lazy='dynamic',
                                primaryjoin='(Entity.id==Grant.giver_id)',
                                cascade='all, delete, delete-orphan')
    grants_received = relationship('Grant', backref='receiver', lazy='dynamic',
                                   primaryjoin='(Entity.id==Grant.receiver_id)',
                                   cascade='all, delete, delete-orphan')
    investments_made = relationship('Investment', backref='giver', lazy='dynamic',
                                    primaryjoin='(Entity.id==Investment.giver_id)',
                                    cascade='all, delete, delete-orphan')
    investments_received = relationship('Investment', backref='receiver', lazy='dynamic',
                                        primaryjoin='(Entity.id==Investment.receiver_id)',
                                        cascade='all, delete, delete-orphan')
    collaborations = relationship('Collaboration', backref='collaborators', lazy='dynamic',
                                  primaryjoin='or_(Entity.id==Collaboration.entity_id1,Entity.id==Collaboration.entity_id2)',
                                  cascade='all, delete, delete-orphan')
    employments = relationship('Employment', backref='employers', lazy='dynamic',
                               primaryjoin='or_(Entity.id==Employment.entity_id1,Entity.id==Employment.entity_id2)',
                               cascade='all, delete, delete-orphan')
    relations = relationship('Relation', backref='relationships', lazy='dynamic',
                             primaryjoin='or_(Entity.id==Relation.entity_id1,Entity.id==Relation.entity_id2)',
                             cascade='all, delete, delete-orphan')
    data_given = relationship('Dataconnection', backref='giver', lazy='dynamic',
                              primaryjoin='(Entity.id==Dataconnection.giver_id)',
                              cascade='all, delete, delete-orphan')
    data_received = relationship('Dataconnection', backref='receiver', lazy='dynamic',
                                 primaryjoin='(Entity.id==Dataconnection.receiver_id)',
                                 cascade='all, delete, delete-orphan')
    # Make this a connection to entities rather than a 'Key Person'.
    key_people = relationship('Keyperson', secondary=keypeople_table, backref='entity',
                              lazy='dynamic')

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return "%s %s" % (self.__class__.__name__, self.id)

    @classmethod
    def delete_memoized_all_as_json(cls):
        print("delete_memoized_all_as_json for %(cls)s" % { 'cls': cls })
        cache.delete_memoized(cls.all_as_json)

    @classmethod
    @cache.memoize(timeout=None)
    def all_as_json(cls):
        return [entity.json() for entity in cls.query.all()]

    def delete_memoized_json(self):
        print("delete_memoized_json for %(self)s" % { 'self': self })
        cache.delete_memoized(self.json)

    @cache.memoize(timeout=None)
    def json(self):
        return {'id': self.id,
                'name': self.name,
                'nickname': self.nickname,
                'description': self.description,
                'locations': [location.json() for location in self.locations],
                'type': self.entitytype,
                'categories': [category.json() for category in self.categories],
                'influence': self.influence,
                'employees': self.employees,
                'url': self.url,
                'twitter_handle': self.twitter_handle,
                'followers': self.followers,
                'revenues': [revenue.json() for revenue in self.revenues],
                'expenses': [expense.json() for expense in self.expenses],
                'grants_given': [grant.json('given') for grant in self.grants_given],
                'grants_received': [grant.json('received') for grant in self.grants_received],
                'investments_made': [investment.json('given') for investment in
                                     self.investments_made],
                'investments_received': [investment.json('received') for investment in
                                         self.investments_received],
                'collaborations': [collaboration.json(self.id) for collaboration in
                                   self.collaborations],
                'employments': [employment.json(self.id) for employment in self.employments],
                'relations': [relation.json(self.id) for relation in self.relations],
                'data_given': [data.json('given') for data in self.data_given],
                'data_received': [data.json('received') for data in self.data_received],
                'key_people': [person.json() for person in self.key_people]
                }

@event.listens_for(Entity, 'after_update')
def receive_after_update(mapper, connection, target):
    print("receive_after_update for %(target)s" % { 'target': target })
    target.delete_memoized_json()

@event.listens_for(Entity, 'after_insert')
@event.listens_for(Entity, 'after_update')
@event.listens_for(Entity, 'after_delete')
def receive_after_event(mapper, connection, target):
    print("receive_after_event for %(target)s" % { 'target': target })
    target.__class__.delete_memoized_all_as_json()

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

    def __repr__(self):
        return '<Finance %f %d>' % (self.amount, self.year)

    def __init__(self, amount, year):
        self.amount = amount
        self.year = year

    def json(self):
        return {'amount': self.amount, 'year': self.year, 'id': self.id}


class Revenue(Finance):
    __mapper_args__ = {'polymorphic_identity': 'revenue'}


class Expense(Finance):
    __mapper_args__ = {'polymorphic_identity': 'expense'}


class Fundingconnection(Base):
    __tablename__ = 'fundingconnection'
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
        if self.receiver is None:
            name = self.giver.name
            funding_id = self.giver_id
        else:
            name = self.receiver.name
            funding_id = self.receiver_id
        return {'amount': self.amount, 'year': self.year, 'entity': name, 'entity_id': funding_id,
                'id': self.id}

    def json_connection(self):
        # TODO: Remove connectiontype = Given/Received
        # Should not have to return type since information is contained in source/target.
        connectiontype = 'Received' if self.receiver else 'Given'
        return {'amount': self.amount, 'year': self.year,
                'source': giver_id, 'target': receiver_id, 'type': connectiontype}


class Grant(Fundingconnection):
    __mapper_args__ = {'polymorphic_identity': 'grant'}


class Investment(Fundingconnection):
    __mapper_args__ = {'polymorphic_identity': 'investment'}


# TODO: Revenue, expense, Grant, Investment should all subclass a single Finance class.
# Possible to subclass a subclass?

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


class Connection(Base):
    __tablename__ = 'connection'
    id = Column(Integer, primary_key=True)
    entity_id1 = Column(Integer, ForeignKey('entity.id'))
    entity_id2 = Column(Integer, ForeignKey('entity.id'))
    entity_1 = relationship('Entity', backref='connection_1',
                            primaryjoin='(Entity.id==Connection.entity_id1)')
    entity_2 = relationship('Entity', backref='connection_2',
                            primaryjoin='(Entity.id==Connection.entity_id2)')
    details = Column(String(500))

    discriminator = Column('type', String(50))
    __mapper_args__ = {'polymorphic_on': discriminator}

    def __init__(self, entity1, entity2, details=None):
        self.entity_1 = entity1
        self.entity_id1 = entity1.id
        self.entity_2 = entity2
        self.entity_id2 = entity2.id
        self.details = details

    def json(self, entityid):
        otherentity = self.entity_1 if entityid == self.entity_id2 else self.entity_2
        if otherentity:
            return {'entity': otherentity.name, 'details': self.details, 'entity_id': otherentity.id,
                'id': self.id}
        else:
            return {'entity': 'NONE', 'details': self.details, 'entity_id': 0, 'id': self.id}

    def getOther(self, entityid):
        return self.entity_1 if entityid == self.entity_id2 else self.entity_2


class Collaboration(Connection):
    __mapper_args__ = {'polymorphic_identity': 'collaboration'}


class Employment(Connection):
    __mapper_args__ = {'polymorphic_identity': 'employment'}


class Relation(Connection):
    __mapper_args__ = {'polymorphic_identity': 'relation'}


# Make this a connection to entities rather than a 'Key Person'.
class Keyperson(Base):
    __tablename__ = 'keyperson'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    entities = relationship('Entity', secondary=keypeople_table, backref='person')

    def __repr__(self):
        return '<Keyperson %r>' % self.name

    def __init__(self, name):
        self.name = name

    def json(self):
        return {'name': self.name, 'id': self.id}


class Edit(Base):
    __tablename__ = 'edit'
    id = Column(Integer, primary_key=True)
    ip = Column(String(100))
    entity_id = Column(Integer, ForeignKey('entity.id'))
    edit_type = Column(String(100))
    edit_time = Column(DateTime, default=datetime.utcnow())

    def __repr__(self):
        return '<Edit %r>' % self.ip

    def __init__(self, ip):
        self.ip = ip

    def json(self):
        return {'id': self.id, 'ip': self.ip, 'entity_id': self.entity_id,
                'edit_type': self.edit_type, 'edit_time': self.edit_time}


class Location(Base):
    __tablename__ = 'location'
    id = Column(Integer, primary_key=True)
    entities = relationship('Entity', secondary=location_table,
                            backref=backref('location', lazy='dynamic'))
    address_line = Column(String(100))
    locality = Column(String(100))
    district = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100))
    country_code = Column(String(2))
    latitude = Column(Float)
    longitude = Column(Float)

    def __repr__(self):
        return '<Location %r>' % self.id

    def json(self):
        return {'id': self.id, 'address_line': self.address_line,
                'locality': self.locality, 'district': self.district,
                'postal_code': self.postal_code,
                'country': self.country, 'country_code': self.country_code,
                'coordinates': [self.latitude, self.longitude]}
