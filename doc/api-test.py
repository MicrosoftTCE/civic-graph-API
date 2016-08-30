import json
import urllib
import requests
import urllib2

# Get Categories
# Returns json object with all categories and their associated id.
# URL: /api/categories
# Method: GET
# URL Params
## Required: None
## Data Params: None
## Success Response: 200
## Error Response: 
# (1) 404 Client Error: NOT FOUND
## OR
# (2) 405 METHOD NOT ALLOWED
# Sample Call:
url = "http://civicgraph.io/api/categories"
data = '{"query":{"categories":[{"id": 1}]}'

response = requests.get(url, data=data)
if (response.ok):
  jData = json.loads(response.content)
  for key in jData:
    print jData[key]
else:
  print response.raise_for_status()


# Get Connections
# URL: /api/connections
# Method: GET
# URL Params
# # Required: None
# # Data Params: None
# # Success Response: 200
# # Error Response:
# (1) 404 Client Error: NOT FOUND
# # OR
# (2) 405 METHOD NOT ALLOWED

## Sample Call:
url = "http://civicgraph.io/api/connections"
data = '{"query":{"connections":{}}'
response = requests.get(url, data=data)
print response.content

if (response.ok):
  jData = json.loads(response.content)
  for key in jData:
    print JData[key] #print all connection types
    print jData[key]["Employment"] #print only Employment connections
    print jData[key]["Collaboration"] #print only Collaboration connections
    print jData[key]["Data"] #print only Data connections
    print jData[key]["Funding"] #print only Funding connections
    print jData[key]["Relation"] #print only Relation connections
else:
  print response.raise_for_status()

# Get Get Entities
# URL: /api/entities
# Method: GET
# URL Params
## Required: None 
## Data Params: None
## Success Response: 200
## Error Response:
# (1) 404 Client Error: NOT FOUND
## OR
# (2) 405 METHOD NOT ALLOWED

## Sample Call:
url = "http://civicgraph.io/api/entities"
print url
data = '{"query":{"nodes":{}}'
response = requests.get(url, data=data)

if (response.ok):
  jData = json.loads(response.content)
  for key in jData:
    print jData[key]
else:
  print response.raise_for_status()
