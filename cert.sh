#!/bin/bash
#generate private key
openssl genrsa -out client-private-key.pem 4096

#generate signing request
openssl req -new -key client-private-key.pem -out client-certificate-signing-request.pem

#self sign the request (or send off the Verisign etc etc)
openssl x509 -req -in client-certificate-signing-request.pem -signkey client-private-key.pem -out client-certificate.pem
