#!/usr/bin/env python

from app import app
from flask import Flask, session
from secrets import flask_session_secret_key

if __name__=="__main__":
	app.secret_key = flask_session_secret_key
	app.run(debug=True)
