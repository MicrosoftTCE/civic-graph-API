from app import app

if __name__ == '__main__':
    if not app.debug:
        import logging
        logging.basicConfig(filename='error.log',level=logging.DEBUG)
    app.run()