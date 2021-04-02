# utility functions for simple text preprocessing and post-processing
def preprocess(sent):
    sent = sent.replace('.', ' .')
    sent = sent.replace(',', ' ,')
    sent = sent.replace('!', ' !')
    sent = sent.replace('?', ' ?')
    sent = sent.replace("\"", " \" ")
    sent = sent.replace("\'", " \' ")
    sent = sent.replace(":", " :")
    sent = sent.replace("-", " - ")
    return sent


def postprocess(sent):
    sent = sent.replace(' .', '.')
    sent = sent.replace(' ,', ',')
    sent = sent.replace(' !', '!')
    sent = sent.replace(' ?', '?')
    sent = sent.replace(" \" ", "\"")
    sent = sent.replace(" \' ", "\'")
    sent = sent.replace(" :", ":")
    sent = sent.replace(" - ", "-")
    return sent
