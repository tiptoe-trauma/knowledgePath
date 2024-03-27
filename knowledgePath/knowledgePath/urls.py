"""
URL configuration for knowledgePath project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from core import views
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path(r'graph/', views.graph, name="graph"),
    path(r'rdf/', views.rdf, name='rdf'),
    path(r'^api/play_count_by_month', views.play_count_by_month, name='play_count_by_month'),
    path("admin/", admin.site.urls),
    path("", views.rdf, name="rdf"),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
