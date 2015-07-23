civicenv
cd ~/civic-graph/app/static/js
rm app.min.js
python -m jsmin app.js > app.min.js
cd ~/civic-graph/app/static/css
rm app.min.css
python -m csscompressor app.css -o app.min.css
echo 'Minified.'
