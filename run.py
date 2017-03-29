#!/usr/bin/env python

from app import app
from config import FLASK_SESSION_SECRET_KEY

if __name__ == "__main__":
    app.secret_key = FLASK_SESSION_SECRET_KEY
    app.run(debug=True)
