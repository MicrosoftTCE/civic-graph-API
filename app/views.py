import json
from flask import jsonify, request, Response, redirect, flash, render_template
from functools import wraps
from sqlalchemy import or_
from werkzeug.security import check_password_hash

from app import app, cache
from app.api import update, getEventEntities, setEventData, getEventConnections
from app.models import Entity, Edit, Category, Revenue, Expense, Fundingconnection, Dataconnection, \
    Collaboration, Employment, Relation
from database import db
from secrets import admin_name, admin_pass, flask_session_secret_key


def check_auth(username, password):
    return username == admin_name and check_password_hash(admin_pass, password)


def authenticate():
    """Sends a 401 response that enables basic auth"""
    return Response(
        'Could not verify your access level for that URL.\n'
        'You have to login with proper credentials', 401,
        {'WWW-Authenticate': 'Basic realm="Login Required"'})


def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)

    return decorated


@app.route('/api/entities', methods=['GET'])
@cache.memoize(timeout=None)

def get_entities():
    data = nodes()
    if 'Event-Name' in request.headers:
        if 'Event-Data-Only' in request.headers:
            return jsonify(nodes=getEventEntities(request.headers['Event-Name']))
        else:
            data += getEventEntities(request.headers['Event-Name'])
    return jsonify(nodes=data)

@app.route('/api/connections')
#@cache.memoize(timeout=None)

def get_connections():
    data = connections()
    if 'Event-Name' in request.headers:
        if 'Event-Data-Only' in request.headers:
            return jsonify(connections=getEventConnections(request.headers['Event-Name']))
        else:
            data += getEventConnections(request.headers['Event-Name'])
    return jsonify(connections=data)

def get_event_data(request):
    eventName = request.headers['Event-Name']
   # app.logger.debug(request.data, 'utf-8')
    data = json.loads(request.data)['entity']
    app.logger.debug(data)
    x=setEventData(eventName, data)
    cache.clear()
    data = nodes()
    if 'Event-Name' in request.headers:
        data += getEventEntities(request.headers['Event-Name'])
    return jsonify(nodes=data)

def connections():
    app.logger.debug(request.headers.get("Event-Name"))
    app.logger.debug('DEBUG')
    app.logger.error('ERROR')
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
    app.logger.debug(request.headers.get("Event-Name"))
    app.logger.debug('DEBUG')
    app.logger.error('ERROR')
    print request.headers.get("Event-Name")
    return jsonify(categories=[category.json() for category in Category.query.all()])


def nodes():
    return [entity.json() for entity in Entity.query.all()]


def edits():
    d = {}
    for edit in Edit.query.all():
        d.setdefault(edit.entity_id, []).append(edit.json())
    return d


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
    if 'Event-Name' in request.headers:
        return get_event_data(request)
    entity = None
    data = json.loads(request.data)['entity']
    data["ip"] = request.remote_addr
    data["edit_type"] = None
    if data['id']:
        entity = Entity.query.get(data['id'])
    elif data['name']:
        data["edit_type"] = "create"
        entity = Entity(data['name'])
        db.add(entity)
        db.commit()
    if entity:
        if not data["edit_type"]:
            data["edit_type"] = "update"
        update(entity, data)
        cache.clear()
    return get_entities()


@app.route('/api/delete', methods=['POST'])
@requires_auth
@cache.memoize(timeout=None)
def delete():
    app.secret_key = flask_session_secret_key
    method = request.form.get('_method')
    id = request.args.get('id')
    if method == 'DELETE':
        db.query(Collaboration) \
            .filter(or_(Collaboration.entity_id1 == id, Collaboration.entity_id2 == id)) \
            .delete(synchronize_session='evaluate')

        db.query(Dataconnection) \
            .filter(or_(Dataconnection.giver_id == id, Dataconnection.receiver_id == id)) \
            .delete(synchronize_session='evaluate')

        db.query(Employment) \
            .filter(or_(Employment.entity_id1 == id, Employment.entity_id2 == id)) \
            .delete(synchronize_session='evaluate')

        db.query(Revenue).filter(Revenue.entity_id == id).delete(synchronize_session='evaluate')

        db.query(Expense).filter(Expense.entity_id == id).delete(synchronize_session='evaluate')

        db.query(Relation) \
            .filter(or_(Relation.entity_id1 == id, Relation.entity_id2 == id)) \
            .delete(synchronize_session='evaluate')

        db.query(Fundingconnection) \
            .filter(or_(Fundingconnection.giver_id == id, Fundingconnection.receiver_id == id)) \
            .delete(synchronize_session='evaluate')

        db.query(Edit).filter(Edit.entity_id == id).delete(synchronize_session='evaluate')

        db.execute("DELETE FROM location_table WHERE entity_id=" + id + ";")
        db.execute("DELETE FROM category_table WHERE entity_id=" + id + ";")
        db.execute("DELETE FROM keypeople_table WHERE entity_id=" + id + ";")

        db.query(Entity).filter(Entity.id == id).delete(synchronize_session='evaluate')

        db.commit()
        cache.clear()
        flash("Delete was successful")
    return redirect('/admin')


@app.route('/admin', methods=['GET'])
@requires_auth
@cache.memoize(timeout=None)
def admin_login():
    data = {
        'nodes': reversed(nodes()),
        'edits': edits()
    }
    return render_template('admin.html', data=data)
