from flask import jsonify, render_template
from app import app, cache
from app.models import Entity, Category, Keyperson, Revenue, Expense, Funding, Investment, Relation, data_table, collaboration_table
from database import db

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
    return [{'source': c.giver_id-1, 'target': c.receiver_id-1} for c in Funding.query.all()]

def investment_connections():
    return [{'source': c.giver_id-1, 'target': c.receiver_id-1} for c in Investment.query.all()]

def data_connections():
    dataconnections = db.query(data_table).all()
    return [{'source': source-1, 'target': target-1} for source, target in dataconnections]

def collaboration_connections():
    collaborationconnections = db.query(collaboration_table).all()
    return [{'source': source-1, 'target': target-1} for source, target in collaborationconnections]

@app.route('/save')
def save():
    pass