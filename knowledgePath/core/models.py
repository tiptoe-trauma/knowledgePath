from __future__ import unicode_literals
from django.db import models
from django.contrib.auth.models import User
# imports for user token creation
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token
from django.core.management import call_command
from django.core.exceptions import ObjectDoesNotExist
import re
from datetime import datetime, timedelta



class Play(models.Model):
    name = models.CharField(max_length=100)
    date = models.DateTimeField()


# Create user tokens
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)


class Survey(models.Model):
    name = models.CharField(max_length=200, blank=True)
    users = models.ManyToManyField(User)
    org_type = models.CharField(max_length=6)
    approved = models.BooleanField(default=False)
    date = models.DateField(null=True, blank=True)
    organization = models.ForeignKey('Organization', on_delete=models.CASCADE, related_name='surveys', blank=True, null=True)
    def __str__(self):
        return self.name
    class Meta:
        managed = False  # Don't let Django create migrations for this
        db_table = 'questionnaire_survey'
        app_label = 'tiptoeDB'

class Organization(models.Model):
    name = models.CharField(max_length=200, blank=True)
    users = models.ManyToManyField(User, blank=True)
    org_type = models.CharField(max_length=6, blank=True)
    def __str__(self):
        return self.name
    class Meta:
        managed = False  # Don't let Django create migrations for this
        db_table = 'questionnaire_organization'
        app_label = 'tiptoeDB'
