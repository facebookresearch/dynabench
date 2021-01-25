# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add sentiment r3 and rearrange rounds to be consistent with the rounds in DynaSent repo.
"""


import secrets

from yoyo import step


secret_round1 = secrets.token_hex()
secret_round3 = secrets.token_hex()

__depends__ = {
    "20210113_01_vFAS9-replace-model-upload-date-with-datetime-and-insert-a-"
    + "datetime-for-null-values",
    "20210115_01_O2h5J-add-hs-r4",
}

steps = [
    step(
        "UPDATE tasks SET cur_round=3 WHERE id=3",
        "UPDATE tasks SET cur_round=1 WHERE id=3",
    ),
    step(
        "UPDATE rounds SET rid=2, url='https://fhcxpbltv0.execute-api.us-west-1"
        + ".amazonaws.com/predict?model=sentiment-r2-1',"
        + 'longdesc=\'The target model is <a target="_blank" '
        + 'href="https://arxiv.org/abs/1907.11692">RoBERTa</a> trained on '
        + '<a target="_blank" href="https://nlp.stanford.edu/sentiment/index.html"'
        + '>the Stanford Sentiment Treebank-2</a>, <a target="_blank" '
        + 'href="https://ai.stanford.edu/~amaas/data/sentiment/">Imdb</a>, '
        + 'the sentiment datasets in <a target="_blank" '
        + 'href="https://arxiv.org/abs/1509.01626">Zhang, et al.</a> (2015), '
        + "and previous rounds from Dynabench."
        + '<br><br><b>Task owners</b>: <a href="mailto:atticusg@gmail.com">'
        + 'Atticus Geiger</a> (Stanford); <a href="https://web.stanford.edu/'
        + '~cgpotts/" target="_blank">Chris Potts</a> (Stanford).\' WHERE id=3',
        "UPDATE rounds SET rid=1, url='https://fhcxpbltv0.execute-api.us-west-1"
        + ".amazonaws.com/predict?model=sentiment-r1-1',"
        + 'longdesc=\'The target model is <a target="_blank" '
        + 'href="https://arxiv.org/abs/1907.11692">RoBERTa</a> trained on '
        + '<a target="_blank" href="https://nlp.stanford.edu/sentiment/index.html"'
        + '>the Stanford Sentiment Treebank-2</a>, <a target="_blank" '
        + 'href="https://ai.stanford.edu/~amaas/data/sentiment/">Imdb</a> and '
        + 'the sentiment datasets in <a target="_blank" '
        + 'href="https://arxiv.org/abs/1509.01626">Zhang, et al.</a> (2015).'
        + '<br><br><b>Task owners</b>: <a href="mailto:atticusg@gmail.com">'
        + 'Atticus Geiger</a> (Stanford); <a href="https://web.stanford.edu/'
        + '~cgpotts/" target="_blank">Chris Potts</a> (Stanford).\' WHERE id=3',
    ),
    step(
        "INSERT INTO rounds (`tid`, `rid`, `secret`, `url`, `desc`, `longdesc`,"
        + "`total_fooled`, `total_collected`, `total_time_spent`, `start_datetime`,"
        + "`end_datetime`, `total_verified_fooled`) VALUES (3,1,'"
        + secret_round1
        + "', 'https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model="
        + "sentiment-r1-1',NULL,'The target model is <a target=\"_blank\" "
        + 'href="https://arxiv.org/abs/1907.11692">RoBERTa</a> trained on '
        + '<a target="_blank" href="https://nlp.stanford.edu/sentiment/index.html"'
        + '>the Stanford Sentiment Treebank-2</a>, <a target="_blank" '
        + 'href="https://ai.stanford.edu/~amaas/data/sentiment/">Imdb</a> and '
        + 'the sentiment datasets in <a target="_blank" '
        + 'href="https://arxiv.org/abs/1509.01626">Zhang, et al.</a> (2015).'
        + '<br><br><b>Task owners</b>: <a href="mailto:atticusg@gmail.com">'
        + 'Atticus Geiger</a> (Stanford); <a href="https://web.stanford.edu/'
        + '~cgpotts/" target="_blank">Chris Potts</a> (Stanford).\','
        + "0,0,'00:00:00',NULL,NULL,0)",
        "DELETE FROM rounds WHERE tid=3 and rid=1",
    ),
    step(
        "INSERT INTO rounds (`tid`, `rid`, `secret`, `url`, `desc`, `longdesc`,"
        + "`total_fooled`, `total_collected`, `total_time_spent`, `start_datetime`,"
        + "`end_datetime`, `total_verified_fooled`) VALUES (3,3,'"
        + secret_round3
        + "', 'https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model="
        + "sentiment-r3-1',NULL,'The target model is <a target=\"_blank\" "
        + 'href="https://arxiv.org/abs/1907.11692">RoBERTa</a> trained on '
        + '<a target="_blank" href="https://nlp.stanford.edu/sentiment/index.html"'
        + '>the Stanford Sentiment Treebank-2</a>, <a target="_blank" '
        + 'href="https://ai.stanford.edu/~amaas/data/sentiment/">Imdb</a> and '
        + 'the sentiment datasets in <a target="_blank" '
        + 'href="https://arxiv.org/abs/1509.01626">Zhang, et al.</a> (2015), '
        + "and previous rounds from Dynabench."
        + '<br><br><b>Task owners</b>: <a href="mailto:atticusg@gmail.com">'
        + 'Atticus Geiger</a> (Stanford); <a href="https://web.stanford.edu/'
        + '~cgpotts/" target="_blank">Chris Potts</a> (Stanford).\','
        + "0,0,'00:00:00',NULL,NULL,0)",
        "DELETE FROM rounds WHERE tid=3 and rid=3",
    ),
]
