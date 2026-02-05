#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))

try:
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Servidor rodando em http://localhost:{PORT}/")
        print(f"Abra em seu navegador: http://localhost:{PORT}/Portal.html")
        print("Pressione Ctrl+C para parar.")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServidor parado.")
    sys.exit(0)
except OSError as e:
    if "Address already in use" in str(e):
        print(f"Porta {PORT} já está em uso. Tente outra porta.")
    sys.exit(1)
