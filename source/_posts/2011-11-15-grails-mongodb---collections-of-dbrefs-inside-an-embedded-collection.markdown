---
layout: post
title: "Grails mongoDB - Collections of DBRefs Inside an Embedded Collection"
date: 2011-11-15 09:39
comments: true
categories: [Grails, mongoDB]
---
Using mongodb and embedded collections works fine with the official mongodb-plugin as long as you know the caveats. What isn't working though is to have your embedded collection referencing another collection. I needed to solve this and had to turn to the Low-level API to get it working. Here's a simple example where a building has many offices and the offices has companies, but the companies need to be in an own collection since we need to query them specificaly.
{% codeblock Person lang:groovy %}
import groovy.transform.EqualsAndHashCode
import org.bson.types.ObjectId

@EqualsAndHashCode
class Building implements Serializable {
	
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
	
	static embedded = ['companies']
		
	String name
	List<DBRef> companies
		
}
{% endcodeblock %}

{% codeblock Company lang:groovy %}
import groovy.transform.EqualsAndHashCode
import org.bson.types.ObjectId

@EqualsAndHashCode
class Company implements Serializable {
			
	ObjectId id
	String name
	
}
{% endcodeblock %}

{% codeblock Testfile lang:groovy %}
import com.mongodb.DBRef
import com.gmongo.GMongo

def mongo = new GMongo("127.0.0.1", 27017)
// Get a db reference in the old fashion way. Could use def mongo inside of a controller or service.
def db = mongo.getDB("foo")

// Create a building 
def building = new Building(name: "Stockholm business centre", offices: [])

// And someone elses office
building.offices << new Office(name: "Bill Gates not so cool workplace")
// Add my office
building.offices << new Office(name: "Andreas's awesome workplace")
building.save()

// Create a company
def company = new Company(name: "Andreas incorporated").save()
// Get the reference
def companyRef = new DBRef(db, "company", company.id)

// Add company to office. 
db.building.update([_id: building.id, 'offices.name': "Andreas's awesome workplace"], [$set: ['offices.$.companies': [companyRef]]])


// QUERYING

// Since the embedded collection doesn't have an id, find it's index in the list.
def myOfficeIndex = building.offices.findIndexOf { it.name == "Andreas's awesome workplace"}

// The DBRef isn't available in GORM even though it's persisted
building.refresh()
assert building.offices[myOfficeIndex].companies == null

// Finding companies through the embedded collection using low level api.
def myOfficeCompanies = db.building.findOne(_id: building.id).offices[myOfficeIndex].companies
assert company.id in myOfficeCompanies

{% endcodeblock %}