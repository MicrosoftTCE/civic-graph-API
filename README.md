# Civic Graph

#### * All API documentation can be found in the developer portal under ```/doc```

## Development Environment Setup

These instructions walk you through setting up a local development environment for civicgraph UI and API.

## Requirements

To set up your development environment, you need `pip` (included with `Python>=2.7.9`).
If you don't have python, you can download it here: https://www.python.org/downloads/

You'll also need Redis (http://redis.io/download) and MySQL.

## Instructions

Clone the git project:
```
git clone https://github.com/MicrosoftTCE/civic-graph.git
```

Copy contents from /sampleconfig into project root:
```
cp sampleconfig/* .
```

Navigate to app/static and install npm:
```
npm install
```
Build minification files:
```
gulp
```
Install virtualenv:
```
pip install -U virtualenv
```
Create a virtual environment in the civic-graph folder:
```
virtualenv env
```
Activate the virtual environment with:
```
.\env\Scripts\activate      # (Windows)
source env/bin/activate     # (Mac/Linux)
```
Then you can install the required packages with:
```
pip install -r requirements.txt
```
Set up mySQL with a username/password (and copy those into secrets.py)
```
mysql -u [user] -p << EOF
CREATE USER 'newuser'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON * . * TO 'newuser'@'localhost';
FLUSH PRIVILEGES;
EOF
```
Import schema.sql into a database named civicgraph
```
mysql -u root -p civicgraph < sql/schema.sql
```
Run redis-server:
```
redis-server /PATH/TO/redis.conf
brew services start redis		    # (Homebrew)
```
Run nginx:
```
brew services start nginx
```
Run uwsgi:
```
uwsgi --ini uwsgi.ini
```
Finally, you can run the application on `http://localhost:5000`:
```
python run.py
```


New stuff:

Server:
```source env/bin/activate && source .env && python run.py```

Shell:
```source env/bin/activate && source .env && python manage.py shell```