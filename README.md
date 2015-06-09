# Civic Graph

## Development
To set up your development environment, you need `pip` (included with `Python>=2.7.9`).  

If you don't have it already, install `virtualenv`:
```
pip install virtualenv
```
Then, create a virtual environment in the civic-graph folder:
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
Finally, you can run the application on `http://localhost:5000`:
```
python run.py
```
