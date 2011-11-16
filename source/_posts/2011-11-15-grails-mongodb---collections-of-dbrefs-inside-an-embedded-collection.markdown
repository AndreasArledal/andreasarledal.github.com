---
layout: post
title: "Grails mongoDB - Collections of DBRefs inside an Embedded Collection"
date: 2011-11-15 09:39
comments: true
categories: [Grails, mongoDB]
---
I'm working on a project where we're migrating from MySQL to mongoDB. One of the reasons for the switch is that the use of embedded collections will simplify our model and make it more efficient. The official mongodb-plugin (1.0.0.RC1) has some problems before it will be ready for production though. One of the problems is that having an embedded collection referencing another collection isn't possible with GORM ([GPMONGODB-92](http://jira.grails.org/browse/GPMONGODB-92 "Associations in an embedded instance should not be forcibly embedded as well")). The workaround is to use the Low-level API instead of GORM. Here's a simple example where a building has many offices and the offices has companies, but the companies need to be in an own collection since we need the possibility to query them specificaly.
<!--more-->
*Only tested with Grails 2.0.0.RC1 and mongodb plugin 1.0.0.RC1*

{% codeblock Person lang:groovy %}
import groovy.transform.EqualsAndHashCode
import org.bson.types.ObjectId

@EqualsAndHashCode
class Building implements Serializable {
	
  static mapWith = 'mongo'	
  
  static embedded = ['offices']
  
  ObjectId id
  String name
  List<Office> offices
  
}
{% endcodeblock %}

{% codeblock Office lang:groovy %}
import groovy.transform.EqualsAndHashCode
import com.mongodb.DBRef

@EqualsAndHashCode
class Office implements Serializable {
      
  String name
  List<DBRef> companies
      
}
{% endcodeblock %}

{% codeblock Company lang:groovy %}
import groovy.transform.EqualsAndHashCode
import org.bson.types.ObjectId

@EqualsAndHashCode
class Company implements Serializable {
	
  static mapWith = 'mongo'
          
  ObjectId id
  String name
  
}
{% endcodeblock %}

{% codeblock Testscript lang:groovy %}
import com.mongodb.DBRef
import com.gmongo.GMongo

def mongo = new GMongo("127.0.0.1", 27017)
// Get a db reference in the old fashion way. Could use def mongo inside of a controller or service.
def db = mongo.getDB("foo")

// Create a building 
def building = new Building(name: "Stockholm business centre", offices: []).save()

// Add someone elses office
building.offices << new Office(name: "Bill Gates not so cool workplace", companies: [])
// Add my office
building.offices << new Office(name: "Andreas awesome workplace", companies: [])
building.save(flush: true)

// Create a company
def company = new Company(name: "Andreas inc").save()
// Get the reference
def companyRef = new DBRef(db, "company", company.id)

// Add company to office. 
Building.collection.update(['_id': building.id, 'offices.name': 'Andreas awesome workplace'], [$set: ['offices.$.companies': [companyRef]]])


// QUERYING

// Since the embedded collection doesn't have an identifier, find it's index in the list.
def myOfficeIndex = building.offices.findIndexOf { it.name == "Andreas's awesome workplace"}

// The DBRef isn't available in GORM even though it's persisted
assert building.offices[myOfficeIndex].companies == []

// Finding companies through the embedded collection using low level api.
def myOfficeCompanies = Building.collection.findOne('_id': building.id).offices[myOfficeIndex].companies
assert company.id in myOfficeCompanies*.id
{% endcodeblock %}