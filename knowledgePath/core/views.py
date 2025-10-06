import requests
from django.conf import settings
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.db import connections
from django.db.models import Count
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.core.mail import send_mail
from rdflib import Graph, BNode, URIRef, Literal, Namespace
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token

from .models import * 


def index(request):
    return HttpResponse("Hello, world.")


def graph(request):
    return render(request, 'graph.html')

def logout_view(request):
    # Log out the user
    logout(request)

    return redirect('login')

def login_view(request):
    if request.user.is_authenticated:
        return redirect('rdf')
    else:
        if request.method == 'POST':
            userEmail = request.POST.get('username')

            try:
                user = User.objects.using('tiptoeDB').get(email=userEmail)
                token, _ = Token.objects.using('tiptoeDB').get_or_create(user=user)

                if (settings.LOGIN_URL):
                    login_url = 'https://{}/?token={}'.format(settings.LOGIN_URL, token)
                else:
                    login_url = 'http://{}/?token={}'.format(request.get_host(), token)

                if (settings.EMAIL_HOST and settings.EMAIL_HOST != 'localhost'):
                    print(settings.EMAIL_HOST)
                    email_message = "Here is your login URL for Knowledge Path Explorer\n\n{}".format(login_url)
                    send_mail(
                            'Knowledge Path Explorer Login',
                            email_message,
                            'questionnaire_retrieval@tiptoe.apps.dbmi.cloud',
                            [user.email],
                            fail_silently=False,
                            )
                else:
                    print(login_url)


                #user = authenticate(request, token=token)
                #print('post user')
                #print(user)
                #if user is not None:
                #    print('trying to login')
                #    login(request, user)
                #    print("Session after login:", request.session.items())  # Print session data

                #    print(request.user.is_authenticated)
                #    print('logged in')
                #    print(request.session.session_key)
                #    response = redirect('rdf')
                #    print(request.user)
                #    print(response.cookies)
                #    return redirect('rdf')

            except User.DoesNotExist:
                error = "User not found"

            #print(token)
            return render(request, 'login_notice.html',
                  {})
             

        elif request.method == 'GET':
            requestToken = request.GET.get('token')
            if requestToken:
                user = authenticate(request, token=requestToken)
                if user is not None:
                    login(request, user)
                    return redirect('rdf')

            return render(request, 'login.html', {})

@api_view(['POST'])
def token_login(request):
    body = json.loads(request.body.decode('utf-8'))
    login_token = body.get('login_token')
    try:
        token = Token.objects.using('tiptoeDB').get(key=login_token)
        return Response({'token': token.key})
    except Token.DoesNotExist:
        return Response("Invalid login token", status=404)
    return Response("Server Error", status=500)

def rdf(request):
    print(request.session.session_key) 
    print(request.user)
    if request.user.is_authenticated:
        organizations = Organization.objects.using('tiptoeDB').filter(users=request.user)
        orgs = [{'id':org.id, 'label': str(org)} for org in organizations]

        triples = None
        targetNode = request.POST.get('target-node') or ''
        targetGraph = request.POST.get('target-graph') or ''
        targetOrg = request.POST.get('target-org') or ''
        latest_survey = None
        if (request.POST.get('node-select') and request.POST.get('org-select')):
            targetNode = request.POST.get('node-select')
            targetOrg = request.POST.get('org-select')
            print(targetOrg)
            org = Organization.objects.using('tiptoeDB').get(id=targetOrg)
            print(org)
            latestSurvey = Survey.objects.using('tiptoeDB').filter(organization=org.id, approved=True).order_by('-date').first()
            print(latestSurvey)

            #targetGraph = 'https://cafe-trauma.com/cafe/survey/167'
        if 'SubmitSearch' in request.POST:
            #here we search for the search term and focus teh node
            print('we searchin')



        print('we should show results')
        if request.method == 'POST':
            if targetNode != '' and latestSurvey != None:
                print('we should show results')
                triples = getDefinitions(targetNode.replace('<survey>', str(latestSurvey.id)), latestSurvey)
                targetNode = "'" + targetNode.replace('<survey>', str(latestSurvey.id)) + "'"
        
        targetGraph = "'" + targetGraph + "'"
        your_nodes = [
            {'value': 'http://purl.obolibrary.org/obo/OOSTT_<survey>/trauma_program', 'label': 'Your Trauma Program'},
            {'value': 'http://purl.obolibrary.org/obo/OOSTT_<survey>/organization', 'label': 'Your Organization'},
            {'value': 'http://purl.obolibrary.org/obo/OOSTT_<survey>/trauma_medical_director', 'label': 'Your Trauma Medical Director'},
            {'value': 'http://purl.obolibrary.org/obo/OOSTT_<survey>/trauma_program_manager', 'label': 'Your Trauma Program Manager'},
            {'value': 'https://cafe-trauma.com/cafe/person/person_1', 'label': 'Patient 1'},
        ]
        print(your_nodes)
        return render(request, 'rdf.html',
                  {'triples': triples,
                   'targetNode': targetNode,
                   'targetGraph': targetGraph,
                   'targetOrg': targetOrg,
                   'your_nodes': your_nodes,
                   'organizations': orgs})
    else:
        print('redirect to login')
        return redirect('login')


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



def getDefinitions(target, latestSurvey):
    targetGraph = 'https://cafe-trauma.com/cafe/survey/' + str(latestSurvey.id)
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

    #target = '<http://purl.obolibrary.org/obo/OOSTT_154/trauma_medical_director>'
    query = query.replace('<target>', target )
    query2 = query2.replace('<targetGraph>', targetGraph )
    queryImp = queryImp.replace('<targetGraph>', targetGraph + '_imp_test')

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

