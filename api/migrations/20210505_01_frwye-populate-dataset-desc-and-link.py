# Copyright (c) Facebook, Inc. and its affiliates.

"""

"""

from yoyo import step


__depends__ = {"20210504_01_cbduZ-remove-invalid-datasets"}

steps = [
    step(
        "ALTER TABLE datasets ADD longdesc Text", "ALTER TABLE datasets DROP longdesc"
    ),
    step(
        "ALTER TABLE datasets ADD source_url Text",
        "ALTER TABLE datasets DROP source_url",
    ),
    step(
        """
UPDATE datasets SET longdesc='The Multi-Genre Natural Language Inference (MultiNLI)
dataset. The "mismatched" genre dev set (9/11, Face-to-face, Letters, Oxford
University Press, Verbatim).',
source_url='https://cims.nyu.edu/~sbowman/multinli/paper.pdf' WHERE
name='mnli-dev-mismatched'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Multi-Genre Natural Language Inference (MultiNLI)
dataset. The "matched" genre dev set (Goverment, Fiction, Telephone, Travel, Slate).',
source_url='https://cims.nyu.edu/~sbowman/multinli/paper.pdf'
WHERE name='mnli-dev-matched'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Stanford Natural Language Inference (SNLI)
dataset dev set.', source_url='https://nlp.stanford.edu/pubs/snli_paper.pdf'
WHERE name='snli-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Stanford Natural Language Inference (SNLI)
dataset dev set.', source_url='https://nlp.stanford.edu/pubs/snli_paper.pdf'
WHERE name='snli-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Natural Language Inference (ANLI)
dataset, round 1, dev set.', source_url='https://arxiv.org/abs/1910.14599'
WHERE name='anli-r1-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Natural Language Inference (ANLI)
dataset, round 1, test set.', source_url='https://arxiv.org/abs/1910.14599'
WHERE name='anli-r1-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Natural Language Inference (ANLI)
dataset, round 2, dev set.', source_url='https://arxiv.org/abs/1910.14599'
WHERE name='anli-r2-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Natural Language Inference (ANLI)
dataset, round 2, test set.', source_url='https://arxiv.org/abs/1910.14599'
WHERE name='anli-r2-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Natural Language Inference (ANLI)
dataset, round 3, dev set.', source_url='https://arxiv.org/abs/1910.14599'
WHERE name='anli-r3-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Natural Language Inference (ANLI)
dataset, round 3, test set.', source_url='https://arxiv.org/abs/1910.14599'
WHERE name='anli-r3-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The DynaSent dynamic benchmark for Sentiment
Analysis, round 1, test set.', source_url='https://arxiv.org/abs/2012.15349'
WHERE name='dynasent-r1-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The DynaSent dynamic benchmark for Sentiment
Analysis, round 2, test set.', source_url='https://arxiv.org/abs/2012.15349'
WHERE name='dynasent-r2-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial QA dataset from "Beat the AI",
round 1, combined test set.', source_url='https://arxiv.org/abs/2002.00293'
WHERE name='aqa-r1-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Hate Speech dataset from "Learning
from the Worst", round 1, test set.', source_url='https://arxiv.org/abs/2012.15761'
WHERE name='ahs-r1-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Hate Speech dataset from "Learning
from the Worst", round 2, test set.', source_url='https://arxiv.org/abs/2012.15761'
WHERE name='ahs-r2-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Hate Speech dataset from "Learning
from the Worst", round 3, test set.', source_url='https://arxiv.org/abs/2012.15761'
WHERE name='ahs-r3-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Diagnostic dataset for syntactic heuristics in Natural
Language Inference.', source_url='https://arxiv.org/abs/1902.01007' WHERE name='hans'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Multi-Genre Natural Language Inference
(MultiNLI) dataset. The "mismatched" genre test set (9/11, Face-to-face,
Letters, Oxford University Press, Verbatim).',
source_url='https://cims.nyu.edu/~sbowman/multinli/paper.pdf'
WHERE name='mnli-test-mismatched'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Multi-Genre Natural Language Inference
(MultiNLI) dataset. The "matched" genre dtest set (Goverment, Fiction,
Telephone, Travel, Slate).',
source_url='https://cims.nyu.edu/~sbowman/multinli/paper.pdf'
WHERE name='mnli-test-matched'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The DynaSent dynamic benchmark for Sentiment Analysis,
round 1, dev set.', source_url='https://arxiv.org/abs/2012.15349'
WHERE name='dynasent-r1-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The DynaSent dynamic benchmark for Sentiment
Analysis, round 2, dev set.', source_url='https://arxiv.org/abs/2012.15349'
WHERE name='dynasent-r2-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Three-label Amazon review dataset from
"Character-level Convolutional Networks for Text Classification",
subsampled test set.', source_url='https://arxiv.org/abs/1509.01626'
WHERE name='amazon-review-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Three-label Amazon review dataset from "Character-level
Convolutional Networks for Text Classification", subsampled dev set.',
source_url='https://arxiv.org/abs/1509.01626' WHERE name='amazon-review-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Three-label Yelp review dataset from "Character-level
Convolutional Networks for Text Classification", subsampled test set.',
source_url='https://arxiv.org/abs/1509.01626' WHERE name='yelp-review-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Three-label Yelp review dataset from
"Character-level Convolutional Networks for Text Classification",
subsampled dev set.', source_url='https://arxiv.org/abs/1509.01626'
WHERE name='yelp-review-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Three-label version of the Stanford Sentiment
Treebank, test set.', source_url='https://nlp.stanford.edu/~socherr/EMNLP2013_RNTN.pdf'
WHERE name='sst3-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Three-label version of the Stanford Sentiment
Treebank, test set.', source_url='https://nlp.stanford.edu/~socherr/EMNLP2013_RNTN.pdf'
WHERE name='sst3-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial QA dataset from "Beat the AI",
round 1, combined dev set.', source_url='https://arxiv.org/abs/2002.00293'
WHERE name='aqa-r1-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Adversarially-created reading comprehension benchmark
requiring discrete reasoning over paragraphs, dev set, via the MRQA 2019 shared task.
', source_url='https://arxiv.org/abs/2104.14690' WHERE name='drop-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Complex language understanding dataset for reading
comprehension using paraphrases, dev set, via the MRQA 2019 shared task.',
source_url='https://arxiv.org/abs/1804.07927' WHERE name='duo-rc-paraphrase-rc-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Multi-hop question answering dataset, dev set,
via the MRQA 2019 shared task.', source_url='https://arxiv.org/abs/1809.09600'
WHERE name='hotpot-qa-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Natural Questions corpus, a question answering dataset
consisting of real anonymized, aggregated queries issued to the Google search engine,
dev set, via the MRQA 2019 shared task.',
source_url='https://research.google/pubs/pub47761/'
WHERE name='natural-questions-short-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Challenging machine comprehension dataset over
news articles, dev set, via the MRQA 2019 shared task.',
source_url='https://arxiv.org/abs/1611.09830' WHERE name='news-qa-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Large-scale multiple-choice reading comprehension
dataset based on examinations, dev set, via the MRQA 2019 shared task.',
source_url='https://arxiv.org/abs/1704.04683' WHERE name='race-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='A question answering dataset derived from the
WikiReading slot filling task, zero-shot benchmark split, dev set, via the MRQA
2019 shared task.', source_url='https://arxiv.org/abs/1706.04115' WHERE
name='relation-extraction-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Question answering dataset augmented with context
from a search engine, dev set, via the MRQA 2019 shared task.',
source_url='https://arxiv.org/abs/1704.05179' WHERE name='search-qa-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Stanford Question Answering Dataset (SQuAD)
reading comprehension benchmark, dev set.',
source_url='https://arxiv.org/abs/1606.05250' WHERE name='squad-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Subset of the textbook question answering dataset for
multimodal machine comprehension, excluding examples with diagrams and yes/no
questions, dev set, via the MRQA 2019 shared task.',
source_url='https://arxiv.org/pdf/1910.09753.pdf' WHERE name='textbook-qa-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Large-scale challenge dataset for reading comprehension
based on trivia, dev set, via the MRQA 2019 shared task.',
source_url='https://arxiv.org/abs/1705.03551' WHERE name='trivia-qa-web-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Hate Speech dataset from
"Learning from the Worst", round 1, dev set.',
source_url='https://arxiv.org/abs/2012.15761' WHERE name='ahs-r1-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Hate Speech dataset from
"Learning from the Worst", round 2, dev set.',
source_url='https://arxiv.org/abs/2012.15761' WHERE name='ahs-r2-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Hate Speech dataset from
"Learning from the Worst", round 3, dev set.',
source_url='https://arxiv.org/abs/2012.15761' WHERE name='ahs-r3-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Functional Test Suite for Hate Speech Detection
Models', source_url='https://arxiv.org/abs/2012.15606' WHERE name='hatecheck'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Large-scale biomedical semantic indexing and
question answering challenge, dev set, via the MRQA 2019 shared task.',
source_url='http://bioasq.org/' WHERE name='bio-asq-dev'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='Stress Test Evaluation Suite for Natural Language
Inference.', source_url='https://arxiv.org/abs/1806.00692' WHERE name='nli-stress-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Hate Speech dataset from
"Learning from the Worst", round 4, test set.',
source_url='https://arxiv.org/abs/2012.15761' WHERE name='ahs-r4-test'
"""
    ),
    step(
        """
UPDATE datasets SET longdesc='The Adversarial Hate Speech dataset from
"Learning from the Worst", round 4, dev set.',
source_url='https://arxiv.org/abs/2012.15761' WHERE name='ahs-r4-dev'
"""
    ),
]
