# Utility functions for simple text preprocessing and post-processing
import re


def preprocess(sent):
    sent = re.sub("([.,!?'\:\-])", r" \1 ", sent)
    return sent


def postprocess(sent):
    sent = re.sub(r'\s+([.,!?"\'\:\-])', r"\1", sent).strip()
    return sent
