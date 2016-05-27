# Civic Graph

## Development Environment Setup

These instructions walk you through setting up a local development environment for civicgraph UI and API.

## Requirements

To set up your development environment, you need `pip` (included with `Python>=2.7.9`).
If you don't have python, you can download it here: https://www.python.org/downloads/ 

You'll also need Redis (http://redis.io/download) and Nginx (http://nginx.org/en/download.html)

## Instructions

Clone the git project:
```
Git clone https://github.com/MicrosoftTCE/civic-graph.git 
```
Copy contents from /sampleconfig into project root:
```
cp sampleconfig/* .
```
Install virtualenv:			
```
pip install -U virtualenv 
```
Create a virtual environment in the civic-graph folder:
```
virtualenv civicenv
```
Activate the virtual environment with:
```
.\civicenv\Scripts\activate      # (Windows)
source civicenv/bin/activate     # (Mac/Linux)
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
mysql -u root -p civicgraph < schema.sql
```
Run redis-server:
```
redis-server /PATH/TO/redis.conf
brew services start redis		    # (Homebrew) 
```
Finally, you can run the application on `http://localhost:5000`:
```
python run.py
```
