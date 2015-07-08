from flask import jsonify, render_template, request
from app import app, cache
from app.models import Entity, Category, Keyperson, Revenue, Expense, Relation, Fundingconnection, Dataconnection, Collaboration, Employment, Relation
from database import db
from api import update
import json

@app.route('/api/entities')
@cache.memoize(timeout=None)
def get_entities():
    return jsonify(nodes=nodes())

@app.route('/api/connections')
@cache.memoize(timeout=None)
def get_connections():
    return jsonify(connections=connections())

def connections():
    return {
        'Funding': funding_connections(),
        'Data': data_connections(),
        'Collaboration': collaboration_connections(),
        'Employment': employment_connections(),
        'Relation': relation_connections()
    }

@app.route('/api/categories')
@cache.memoize(timeout=None)
def categories():
    return jsonify(categories=[category.json() for category in Category.query.all()])

def nodes():
    return [entity.json() for entity in Entity.query.all()]

def funding_connections():
    # Watch out for IDs/indexes: http://stackoverflow.com/a/16824896
    return [{'source': f.giver_id, 'target': f.receiver_id} for f in Fundingconnection.query.all()]

def data_connections():
    return [{'source': d.giver_id, 'target': d.receiver_id} for d in Dataconnection.query.all()]

def collaboration_connections():
    return [{'source': c.entity_id1, 'target': c.entity_id2} for c in Collaboration.query.all()]

def employment_connections():
    return [{'source': e.entity_id1, 'target': e.entity_id2} for e in Employment.query.all()]

def relation_connections():
    return [{'source': r.entity_id1, 'target': r.entity_id2} for r in Relation.query.all()]

@app.route('/api/save', methods=['POST'])
def save():
    app.logger.debug('SAVING')
    app.logger.debug(request.data)
    entity = None
    data = json.loads(request.data)['entity']
    if data['id']:
        entity = Entity.query.get(data['id'])
    elif data['name']:
        app.logger.debug('ADDING NEW ENTITY ' + str(data['name']))
        entity = Entity(str(data['name']))
        db.add(entity)
        db.commit()
    if entity:
        app.logger.debug('UPDATING ENTITY ' + entity.name)
        update(entity, data)
        cache.clear()
    else:
        app.logger.debug('NO UPDATE')
    return get_entities()
