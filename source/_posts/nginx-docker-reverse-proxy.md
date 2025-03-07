---
title: Nginx Docker Reverse Proxy
author: Morgan
photos: /img/docker/code.png
date: 2020-08-19
---
I've been working on a basic setup to host a number of sites through docker on a local machine. The theory goes<!-- more -->:

Port 80 traffic hits my router and is forwarded to my computer with Docker on it
An nginx docker image handles the request and, based on the domain, routes the request to another docker container with a specified port
The final container serves the response.

Here's how I've set things up.

### docker-compose.yml
```dockerfile
version: '3'

services:
reverse:
container_name: reverse
hostname: reverse
image: nginx
ports:
- 80:80
volumes:
- ${PWD}/nginx:/etc/nginx
```

The nginx folder needs to be created, but will be empty to start. We need, at a minimum the mime.types file and an nginx.conf


### mime.types

```
types {
text/html                             html htm shtml;
text/css                              css;
text/xml                              xml rss;
image/gif                             gif;
image/jpeg                            jpeg jpg;
application/x-javascript              js;
text/plain                            txt;
text/x-component                      htc;
text/mathml                           mml;
image/png                             png;
image/x-icon                          ico;
image/x-jng                           jng;
image/vnd.wap.wbmp                    wbmp;
application/java-archive              jar war ear;
application/mac-binhex40              hqx;
application/pdf                       pdf;
application/x-cocoa                   cco;
application/x-java-archive-diff       jardiff;
application/x-java-jnlp-file          jnlp;
application/x-makeself                run;
application/x-perl                    pl pm;
application/x-pilot                   prc pdb;
application/x-rar-compressed          rar;
application/x-redhat-package-manager  rpm;
application/x-sea                     sea;
application/x-shockwave-flash         swf;
application/x-stuffit                 sit;
application/x-tcl                     tcl tk;
application/x-x509-ca-cert            der pem crt;
application/x-xpinstall               xpi;
application/zip                       zip;
application/octet-stream              deb;
application/octet-stream              bin exe dll;
application/octet-stream              dmg;
application/octet-stream              eot;
application/octet-stream              iso img;
application/octet-stream              msi msp msm;
audio/mpeg                            mp3;
audio/x-realaudio                     ra;
video/mpeg                            mpeg mpg;
video/quicktime                       mov;
video/x-flv                           flv;
video/x-msvideo                       avi;
video/x-ms-wmv                        wmv;
video/x-ms-asf                        asx asf;
video/x-mng                           mng;
}
```

### nginx.conf
```
user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
worker_connections  1024;
}

http {
include       /etc/nginx/mime.types;
default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    access_log  /var/log/nginx/access.log  main;
    sendfile        on;
    keepalive_timeout  65;
    gzip  on;

    client_max_body_size 10M;

    upstream ghost {
      server        192.168.88.44:8000;
    }
    server {
      listen        80;
      server_name   web.dev example.com www.example.com;

      location / {
        proxy_pass  http://ghost;
      }
    }

    upstream php {
      server        192.168.88.44:9000;
    }

    server {
      listen        80;
      server_name   php.web.dev php.example.com;

      location / {
        proxy_pass  http://php;
      }
    }
}
```

The connection between the upstreams, which point to the specific server and port on my network and the servers, which point the domains to the upstreams is key to getting this to work. Because the proxy is listening to port 80 for all traffic, each server will have port 80 as it's listen.

Finally, the docker-compose.yml for my other services will have their upstream port mapped to port 80 (in most cases) which ties the whole thing together.

### An example service's docker-compose file

```dockerfile
services:
    servicename:
        ports:
            - 9000:80
```
