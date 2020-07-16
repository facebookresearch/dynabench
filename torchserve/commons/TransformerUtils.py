import hashlib
import logging
logger = logging.getLogger(__name__)

def generate_response_signature(my_task_id, my_round_id, my_secret, stringlist):
    """ 
    This function generates a unique signature based on task, round, input and probability 
    """
    h = hashlib.sha1()
    for x in stringlist:
        h.update(x.encode('utf-8'))
    h.update("{}{}".format(my_task_id, my_round_id).encode('utf-8'))
    h.update(my_secret.encode('utf-8'))
    signed = h.hexdigest()
    logger.info('Signature {}'.format(signed))
    return signed

def check_fields(data, fields):
    """ 
    Checks if the attributes present in the fields list are present in data
    """
    if not data:
        return False
    for f in fields:
        if f not in data:
            print(f"The {f} is not present")
            return False
    return True