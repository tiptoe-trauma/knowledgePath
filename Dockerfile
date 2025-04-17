FROM python:3.10.9-alpine

RUN mkdir -p /code

WORKDIR /code

EXPOSE 3000

RUN apk update && \
    apk add --no-cache \
        gcc \
        musl-dev \
        libc-dev \
        linux-headers \
        postgresql-dev \
        nodejs \
        yarn

COPY requirements.txt .
RUN pip install -r requirements.txt

RUN pip install gunicorn

COPY ./knowledgePath ./knowledgePath

WORKDIR /code/knowledgePath

RUN yarn install
RUN yarn build
RUN rm -rf node_modules
RUN apk del yarn nodejs

ARG TRIPLESTORE_URL
ENV TRIPLESTORE_URL=$TRIPLESTORE_URL
ARG TRIPLESTORE_PASSWORD
ENV TRIPLESTORE_PASSWORD=$TRIPLESTORE_PASSWORD
ARG ALLOWED_HOSTS
ENV ALLOWED_HOSTS=$ALLOWED_HOSTS


ENV DJANGO_SETTINGS_MODULE=knowledgePath.settings
ENTRYPOINT ["gunicorn"]
CMD ["knowledgePath.wsgi", "--bind=:3000", "--workers=2"]
