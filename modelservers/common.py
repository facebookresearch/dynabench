from aiohttp import web
import logging
import ssl
import hashlib

def get_cors_headers(cors_url):
    headers = {}
    valid_cors_urls = ['http://54.187.22.210', 'http://54.187.22.210:3000', 'http://dynabench.org:3000', 'http://beta.dynabench.org', 'http://beta.dynabench.org:3000'] + \
                        ['https://54.187.22.210', 'https://54.187.22.210:3000', 'https://dynabench.org:3000', 'https://beta.dynabench.org', 'https://beta.dynabench.org:3000']

    if cors_url not in valid_cors_urls:
        cors_url = 'http://dynabench.org'
    headers['Access-Control-Allow-Origin'] = cors_url
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token, Authorization'
    headers['Access-Control-Allow-Credentials'] = 'true'
    return headers

async def handle_options(request):
    cors_url = request.headers.get('origin')
    return web.Response(headers=get_cors_headers(cors_url))

def launch_modelserver(url_secret, url_port, handler):
    app = web.Application()
    app.add_routes([
        web.options(f"/{url_secret}", handle_options),
        web.post(f"/{url_secret}", handler),
        ])

    logging.info("Launching HTTPS Server")

    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_cert_chain('/home/ubuntu/.ssl/dynabench.org.crt', keyfile='/home/ubuntu/.ssl/dynabench.org-key.pem')
    web.run_app(app, ssl_context=ssl_context, port=url_port)

def generate_response_signature(my_task_id, my_round_id, my_secret, stringlist):
    h = hashlib.sha1()
    for x in stringlist:
        h.update(x.encode('utf-8'))
    h.update("{}{}{}".format(my_task_id, my_round_id, my_secret).encode('utf-8'))
    signed = h.hexdigest()
    logging.info('Signature {}'.format(signed))
    return signed

