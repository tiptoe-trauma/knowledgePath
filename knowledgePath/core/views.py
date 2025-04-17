import requests
from django.conf import settings
from django.shortcuts import render
from django.http import HttpResponse
from django.db import connections
from django.db.models import Count
from django.http import JsonResponse
from rdflib import Graph, BNode, URIRef, Literal, Namespace

from .models import Play


def index(request):
    return HttpResponse("Hello, world.")


def graph(request):
    return render(request, 'graph.html')

def rdf(request):
    triples = None
    target = request.POST.get('target-node') or ''
    targetGraph = request.POST.get('target-graph') or ''
    if (request.POST.get('node-select')):
        target = request.POST.get('node-select')
        targetGraph = 'https://cafe-trauma.com/cafe/survey/167'
    if 'SubmitSearch' in request.POST:
        #here we search for the search term and focus teh node
        print('we searchin')



    if request.method == 'POST':
        if target != '':
            triples = getDefinitions(target, targetGraph)
    
    target = "'" + target + "'"
    targetGraph = "'" + targetGraph + "'"
    your_nodes = [
        {'value': 'http://purl.obolibrary.org/obo/OOSTT_167/trauma_program', 'label': 'Your Trauma Program'},
        {'value': 'http://purl.obolibrary.org/obo/OOSTT_167/organization', 'label': 'Your Organization'},
        {'value': 'http://purl.obolibrary.org/obo/OOSTT_167/trauma_medical_director', 'label': 'Your Trauma Medical Director'},
        {'value': 'http://purl.obolibrary.org/obo/OOSTT_167/trauma_program_manager', 'label': 'Your Trauma Program Manager'},
        {'value': 'https://cafe-trauma.com/cafe/person/person_1', 'label': 'Patient 1'},
    ]
    return render(request, 'rdf.html',
                  {'triples': triples,
                   'targetNode': target,
                   'targetGraph': targetGraph,
                   'your_nodes': your_nodes})


def play_count_by_month(request):
    data = Play.objects.all() \
        .extra(
            select={
                'month': "select '2023-04-01' from core_play"
            }
        ) \
        .values('month') \
        .annotate(count_items=Count('id'))
    print(list(data))
    return JsonResponse(list(data), safe=False)



def getDefinitions(target, targetGraph):
    query =  """
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
select * 
where {
    
    ?s ?p ?o .
        filter(?s = <<target>> ||
   		?o = <<target>>)
    OPTIONAL {
    	?p rdfs:label ?plabel .
    } OPTIONAL {
    	?s rdfs:label ?slabel .
    } OPTIONAL {
    	?o rdfs:label ?olabel .
    }

} limit 100 
"""
    query2 = """
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
select * 
where {
    GRAPH <<targetGraph>> {

        ?s ?p ?o .
    } OPTIONAL {
    	?p rdfs:label ?plabel .
    } OPTIONAL {
    	?s rdfs:label ?slabel .
    } OPTIONAL {
    	?o rdfs:label ?olabel .
    } 
} 
"""
#from <http://www.ontotext.com/implicit>
    queryImp = """
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
select ?s ?p ?o ?slabel ?plabel ?olabel
where {
    GRAPH <https://cafe-trauma.com/cafe/survey/167_imp_test> {

        ?s ?p ?o .
    } OPTIONAL {
    	?p rdfs:label ?plabel .
    } OPTIONAL {
    	?s rdfs:label ?slabel .
    } OPTIONAL {
    	?o rdfs:label ?olabel .
    } 
} 
"""

    #target = '<http://purl.obolibrary.org/obo/OOSTT_154/trauma_medical_director>'
    query = query.replace('<target>', target )
    query2 = query2.replace('<targetGraph>', targetGraph )
    queryImp = queryImp.replace('<targetGraph>', targetGraph )

    body = {'query': query2, 'Accept': 'application/sparql-results+json' }
    bodyImp = {'query': queryImp, 'Accept': 'application/sparql-results+json' }
    headers = {'content-type': 'application/x-www-form-urlencoded'}
    headersImp = {'content-type': 'application/x-www-form-urlencoded'}
    try:
        r = requests.request('POST', settings.TRIPLESTORE_URL, data=body, headers=headers, auth=(settings.TRIPLESTORE_USER, settings.TRIPLESTORE_PASSWORD), verify=False)
        rImp = requests.request('POST', settings.TRIPLESTORE_URL, data=bodyImp, headers=headersImp, auth=(settings.TRIPLESTORE_USER, settings.TRIPLESTORE_PASSWORD), verify=False)
        if r.ok and rImp.ok:
        #if r.ok:
            try:
                terms = []
                data = r.json()
                dataImp = rImp.json()
                #print(dataImp)
                terms = addTerms(data, terms)
                terms = addTerms(dataImp, terms)
                file_path = 'response_content.txt'

                # Open the file in write ('w') mode and write the content
                with open(file_path, 'w', encoding='utf-8') as file:
                    file.write(r.text)
                    file.write(rImp.text)

                print('Length ' + str(len(terms)))
                #print(terms)
                return terms
            except ValueError:
                print('Bad json data')
                print(r.content)
                return []
        else:
            print(r)
            return []
    except:
        print('failed rdf')
        return []


def addTerms(data, terms):
    for term in data['results']['bindings']:
        toAdd = {}
        if 'slabel' in term.keys():
            toAdd['slabel'] = term['slabel']['value']
            toAdd['subject'] = term['s']['value']
        else:
            toAdd['slabel'] = term['s']['value']
            toAdd['subject'] = term['s']['value']
        if 'plabel' in term.keys():
            toAdd['plabel'] = term['plabel']['value']
            toAdd['predicate'] = term['p']['value']
        else:
            toAdd['plabel'] = term['p']['value']
            toAdd['predicate'] = term['p']['value']
        if 'olabel' in term.keys():
            toAdd['olabel'] = term['olabel']['value']
            toAdd['object'] = term['o']['value']
        else:
            toAdd['olabel'] = term['o']['value']
            toAdd['object'] = term['o']['value']

        if (toAdd['slabel'].startswith('x') and len(toAdd['slabel']) == 23):
            toAdd['slabel'] = 'bnode'
        if (toAdd['olabel'].startswith('x') and len(toAdd['olabel']) == 23):
            toAdd['olabel'] = 'bnode'
        if (toAdd['plabel'] == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'):
            toAdd['plabel'] = 'is a'


        terms.append(toAdd)
    return terms

