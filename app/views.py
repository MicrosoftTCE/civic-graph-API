from flask import jsonify, render_template, request
from app import app, cache
from app.models import Entity, Category, Keyperson, Revenue, Expense, Funding, Investment, Relation, Dataconnection, collaboration_table
from database import db
from api import update
import json

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/entities')
@cache.cached(key_prefix='entities', timeout=None)
def civic_json():
    return jsonify(
        nodes=nodes(),
        funding_connections=funding_connections(),
        investment_connections=investment_connections(),
        data_connections=data_connections(),
        collaboration_connections=collaboration_connections()
    )

@app.route('/categories')
@cache.cached(key_prefix='categories', timeout=None)
def categories():
    return jsonify(categories=[category.name for category in Category.query.all()])

def nodes():
    return [entity.json() for entity in Entity.query.all()]

def funding_connections():
    # Watch out for IDs/indexes: http://stackoverflow.com/a/16824896
    return [{'source': c.giver_id, 'target': c.receiver_id} for c in Funding.query.all()]

def investment_connections():
    return [{'source': c.giver_id, 'target': c.receiver_id} for c in Investment.query.all()]

def data_connections():
    return [{'source': c.giver_id, 'target': c.receiver_id} for c in Dataconnection.query.all()]

def collaboration_connections():
    collaborationconnections = db.query(collaboration_table).all()
    return [{'source': source, 'target': target} for source, target in collaborationconnections]

@app.route('/save', methods=['POST'])
def save():
    data = json.loads(request.data)['entity']
    entity = Entity.query.get(data['id'])
    update(entity, data)
    return 'SAVE'
