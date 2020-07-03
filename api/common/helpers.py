import bottle
from urllib.parse import urlparse

def check_fields(data, fields):
    if not data:
        return False
    for f in fields:
        if f not in data:
            return False
    return True

def parse_url(url):
    """
    parse and extract the host name and server scheme from request url
    :param url: 
    :return: url hostname {https://dynabench.org}
    """
    try:
        parsed_uri = urlparse(url)
        formed_url = '{uri.scheme}://{uri.netloc}'.format(uri=parsed_uri)
        return formed_url
    except Exception as ex:
        return "https://dynabench.org"
