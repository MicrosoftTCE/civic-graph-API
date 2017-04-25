#!/usr/bin/env python

import click
from flask.cli import FlaskGroup
from app import app
from app.models import Entity, Edit, Category, Revenue, Expense, Fundingconnection, Dataconnection, \
    Collaboration, Employment, Relation
from config import FLASK_SESSION_SECRET_KEY

def app_factory(info):
    app.secret_key = FLASK_SESSION_SECRET_KEY
    return app

@click.group(cls=FlaskGroup, create_app=app_factory)
def cli():
    """This is a management script for the application."""

if __name__ == "__main__":
    cli()
