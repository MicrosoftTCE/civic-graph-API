import csv
import codecs
import MySQLdb
from app import app
from database import db
from models import Entity, Location

# class Entity:
#     def __init__(self, name, location, entity_type):
#         self.name = name
#         self.location = location
#         self.entity_type = entity_type
#

#     def __str__(self):
#         return self.name + str(self.location) + self.entity_type
#
#     def __repr__(self):
#         return self.__str__()
#
# class Location:
#     def __init__(self, full_address):
#         self.full_address = full_address
#
#     def __hash__(self):
#         return hash(self.full_address)
#
#     def __eq__(self, other):
#         return (self.full_address) == (other.full_address)
#
#     def __ne__(self, other):
#         return not (self == other)
#
#     def __str__(self):
#         return self.full_address
#
#     def __repr__(self):
#         return self.__str__()

entity_types = {'forprofit': 'For-Profit', 'nonprofit': 'Non-Profit', 'government': 'Government',
                'social_movements': 'Social_Movements'}

def data_import():
    with open('/Users/brianavecchione/Downloads/AAFE.csv','rb') as csvfile:
        csvfile.readline()
        reader = csv.reader(csvfile)
        orgIndividualMap = {}
        entityHashMap = {}
        for row in reader:
            app.logger.debug(row)
            individual = Entity(unicode(row[0]))
            # location = Location()
            # location.address_line = row[3]
            entity_type = entity_types.get(unicode(row[2]), '""')
            org = Entity(unicode(row[1]))
            # org.locations = [location]
            org.entitytype = entity_type
            # unique entities found
            entityHashMap[individual] = individual
            entityHashMap[org] = org
            # request individuals linked to org, return empty if not found
            individualList = orgIndividualMap.get(org, [])
            # adds the individual to list
            individualList.append(individual)
            # updates list
            orgIndividualMap[org] = individualList

        app.logger.debug(orgIndividualMap)
        app.logger.debug(entityHashMap)


    # iterates through unique entities
        for key, value in entityHashMap.iteritems():
            db.add(value)
        # TODO: insert value into db
        # TODO: assign new ids to value
        # key = hash, value = current entity in loop

            for org, individualList in orgIndividualMap.iteritems():
                orgWithID = entityHashMap.get(org)
                for individual in individualList:
                    individualWithID = entityHashMap.get(individual)

                # insert relationship
        db.commit()
# conn = MySQLdb.connect(host="localhost",
#                        user="root",
#                        passwd="newpassword",
#                        db="engy1")
# x = conn.cursor()
#
# 'INSERT * INTO entity'  # ids from orgs to map
# ids from individuals
# matching orgs and individuals??

# create new db

# create sql insert from map
# run in mysql
