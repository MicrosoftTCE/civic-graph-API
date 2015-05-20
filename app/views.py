from flask import jsonify
from app import app
from app.models import Entity, Category, Keyperson, Revenue, Expense, Funding, Investment, Relation


@app.route('/athena')
def civic_json():
    return jsonify(
        nodes=nodes(),
        funding_connections=funding_connections(),
        investment_connections=investment_connections()
    )

def nodes():
    return [entity.json() for entity in Entity.query.all()]

def funding_connections():
    return [{'source': c.giver_id, 'target': c.receiver_id} for c in Funding.query.all()]

def investment_connections():
    return [{'source': c.giver_id, 'target': c.receiver_id} for c in Investment.query.all()]

