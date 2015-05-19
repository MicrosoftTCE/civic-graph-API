from flask import jsonify
from app import app
from app.models import Entity, Category, Keyperson, Revenue, Expense, Funding, Investment, Relation


@app.route('/athena')
def civic_json():
    return jsonify(
        nodes=[entity.json() for entity in Entity.query.all()]
        )