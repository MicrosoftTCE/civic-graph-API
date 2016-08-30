# Welcome to the Civic Graph Developer Portal!

**Getting Started**
----

__Civic Graph__ is an open source data and visualization project initiated by Microsoft's Technology & Civic Innovation team.
The purpose of Civic Graph is to provide insights into the burgeoning civic tech community -- who it consists of, what their respective focus areas are, and how they connect to one another.
We see Civic Graph as an educational tool, a platform to crowdsource up-to-date information regarding the civic tech community, and a basis to use the data to build out new visualizations, tools, and apps. We invite you to contribute to Civic Graph by:
* Adding to or editing our current information
* Using Civic Graph's data via our API
* Helping us improve Civic Graph by contributing to our [source code](https://github.com/MicrosoftTCE/civic-graph)
* 
All API access is over HTTP and accessed via the http://civicgraph.io domain. No client authentication credentials, URL parameters, or data parameters are required at this time.

**Requests & Responses**
----
`GET` requests are the only available way to interact with the API. Responses from the API are returned in JSON format. Structures are listed below.

**Status Codes**
----

| Code   | Method                    | Description                                                              |
| ------ | ------------------------- | ------------------------------------------------------------------------ |
| 200    | OK                        | Success                                                                  |
| 404    | NOT FOUND                 | The requested URL was not found on the server.                           |
| 405    | METHOD NOT ALLOWED        | Method received in the request-line is known by the origin server but not supported by the target                                        resource.                                                                |
| 413    | REQUEST ENTITY TOO LARGE  | Request payload is larger than the server is willing or able to process. |

**Endpoints**
----

### Categories
----
Schema associating civic tech categories with corresponding integer ID. 

#### URL: 
  `/api/categories`
  
| Component   | Description                                                              |
| ----------- | ------------------------------------------------------------------------ |
| id          | identification number                                                    |
| name        | civic tech category                                                      |

* **Response:**

  * **Code:** 200 <br />
    **Content:** {"categories": [{"id": 1, "name": "Smart & Resilient Cities"}, {"id": 2, "name": "Data & Analytics"}, {"id": 3, "name": "General Civic Tech"}, {"id": 4, "name": "Social Services"}, {"id": 5, "name": "Jobs & Education"}, {"id": 6, "name": "GovTech"}]}
    
 
* **Sample Call:**

  ```python
      url = "http://civicgraph.io/api/categories"
      data = '{"query":{"categories":[{}]}'

      response = requests.get(url, data=data)
      if (response.ok):
        jData = json.loads(response.content)
        for key in jData:
          print jData[key]
      else:
        print response.raise_for_status()
  ```

----
**Get Connections**
----
  Returns all connections (grouped by connection type) with source and target ids for each connection.

#### URL:
  `/api/connections`

| Component         | Description                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| collaboration     | identifies a collaboration                                               |
| data              | identifies a data exchange                                               |
| employment        | identifies employment                                                    |
| funding           | identifies a funding exchange                                            |

* **Response:**

  * **Code:** 200 <br />
    **Content:** {"connections": {"Collaboration": [{"source": 1, "target": 22}, {u'Employment': [{u'source': 116, u'target': 283}, ...... {"source": 586, "target": 337}], "Employment": [{"source": 116, "target": 283}, ......]}}
    
* **Sample Call:**

  ```python
      url = "http://civicgraph.io/api/connections"
      data = '{"query":{"connections":{}}'
      response = requests.get(url, data=data)

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
  ```

----
**Get Entities**
----
  Returns all entity data.

#### URL: 
  `/api/entities`
  
| Component            | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| categories           | all associated categories                                              |
| collaborations       | all associated collaborations with other entities                                            |
| data_given           | data exchanges given                                                    |
| data_recieved        | data exchanges recieved                                           |
| description          | detailed description                                               |
| employees            | size of employee base (if applicable)                                              |
| employments          | lists entity employments                                                    |
| expenses             | lists expenses incurred by entity                                            |
| followers            | Twitter follower size                                               |
| grants_given         | grants funded                                               |
| grants_recieved      | grants recieved                                                   |
| id                   | entity ID                                            |
| influence            | entity influence (local, national, global)                                               |
| investments_made     | investments funded                                               |
| investments_received | investments received                                                    |
| key_people           | key people associated with the entity (employees, frequent collaborators, etc.                                 |
| locations            | locations where the entity exists                                               |
| name                 | entity name                                               |
| nickname             | entity nickname (if applicable)                                                    |
| revenues             | known revenues                                               |
| twitter_handle       | entity Twitter handle                                               |
| type                 | entity type (For-Profit, Non-Profit, Individual, Gov.                                                   |
| url                  | associated URL                                           |
  
* **Response:**

  * **Code:** 200 <br />
    **Content:** [{u'key_people': [], u'twitter_handle': u'@yasminfodil', u'grants_received': [], u'influence': u'Local', u'locations': [{u'district': u'NY', u'locality': u'New York', u'country': u'United States', u'full_address': u'New York, NY', u'postal_code': None, u'coordinates': [40.782, -73.8317], u'country_code': u'US', u'address_line': None, u'id': 0}], u'expenses': [], u'id': 0, u'relations': [], u'followers': 1655, u'data_given': [], u'employments': [], u'type': u'Individual', u'description': u'I create experiences / services that solve public problems. Also - Adjunct Professor at @NYU_Wagner', u'grants_given': [], u'investments_made': [], u'nickname': u'Yasmin', u'categories': [{u'id': 3, u'name': u'General Civic Tech'}, {u'id': 4, u'name': u'Social Services'}, {u'id': 5, u'name': u'Jobs & Education'}, {u'id': 6, u'name': u'GovTech'}], u'name': u'Yasmin Fodil', u'collaborations': [{u'id': 911, u'entity_id': 290, u'details': None, u'entity': u'Alexander Howard'}], u'employees': None, u'data_received': [], u'url': u'http://yasminfodil.com', u'revenues': [], u'investments_received': []}, ......}]
    
* **Sample Call:**

  ```python
      url = "http://civicgraph.io/api/entities"
      data = '{"query":{"connections":{}}'
      response = requests.get(url, data=data)

      if (response.ok):
        jData = json.loads(response.content)
        for key in jData:
          print JData[key]
      else:
        print response.raise_for_status()
  ```

----
**Additional Resources:**
----
We've included all of the sample calls listed above in a separate Python script. Access it [here](https://github.com/hcutler/civicgraph-api/blob/master/api-test.py), and feel free to contribute to it!

----

An open-source project by

![alt text](https://assets.onestore.ms/cdnfiles/onestorerolling-1607-15000/shell/v3/images/logo/microsoft.png "Logo Title Text 2")
