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
    if request.method == 'POST':
        if request.POST.get('target-node'):
            triples = getDefinitions(request.POST.get('target-node'))
    
    return render(request, 'rdf.html',
                  {'triples': triples})


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



def getDefinitions(target):
    query =  """
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
select * 
where {
    
    ?s ?p ?o .
        filter(?s = <target> ||
   		?o = <target>)

} limit 100 
"""

    #target = '<http://purl.obolibrary.org/obo/OOSTT_154/trauma_medical_director>'
    query = query.replace('<target>', target )

    body = {'query': query, 'Accept': 'application/sparql-results+json' }
    headers = {'content-type': 'application/x-www-form-urlencoded'}
    try:
        r = requests.request('POST', settings.TRIPLESTORE_URL, data=body, headers=headers, auth=(settings.TRIPLESTORE_USER, settings.TRIPLESTORE_PASSWORD), verify=False)
        if r.ok:
            try:
                data = r.json()
                print(data)
                terms = []
                for term in data['results']['bindings']:
                    toAdd = {}
                    if 'slabel' in term.keys():
                        toAdd['subject'] = term['slabel']['value']
                    else:
                        toAdd['subject'] = term['s']['value']
                    if 'plabel' in term.keys():
                        toAdd['predicate'] = term['plabel']['value']
                    else:
                        toAdd['predicate'] = term['p']['value']
                    if 'olabel' in term.keys():
                        toAdd['object'] = term['olabel']['value']
                    else:
                        toAdd['object'] = term['o']['value']

                    terms.append(toAdd)
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



