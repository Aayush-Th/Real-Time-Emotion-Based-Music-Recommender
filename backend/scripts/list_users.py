from mongo_db import db
from pprint import pprint

if db is None:
    print('No DB connection')
else:
    users = db['users']
    docs = list(users.find({}, {'password_hash': 0}).limit(50))
    if not docs:
        print('No users found')
    for d in docs:
        d['_id'] = str(d.get('_id'))
        pprint(d)
