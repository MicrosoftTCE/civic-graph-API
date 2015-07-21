#!/usr/bin/env python

from app import app
from flask.ext.cors import CORS
cors = CORS(app)

if __name__=="__main__":
	app.run(host='0.0.0.0', debug=True)
