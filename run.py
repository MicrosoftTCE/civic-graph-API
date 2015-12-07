#!/usr/bin/env python

from app import app
from flask import Flask, session

if __name__=="__main__":
	app.secret_key = 'A\xfbf\xd0\x86\r\xd9\xc9\x04\x8f\xd4\x04\xe0.2^\x82\xc7)\xbf\x0e\x98f\xfc\xa2\x91J0be\xa0\xd6\x03\xd6\x17\xee,\xef\x93'
	app.run(debug=True)
