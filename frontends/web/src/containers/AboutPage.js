/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Button, Container, Col } from "react-bootstrap";

const AboutPage = () => (
  <Container className="mb-5 pb-5">
    <Col className="m-auto" lg={9}>
      <div className="mb-5 text-center">
        <h1 className="my-4 pt-3 text-uppercase">About</h1>
        <h2 className="task-page-header d-block font-weight-normal m-0 text-reset">
          Dynabench is a platform for dynamic data collection and
          benchmarking. Static benchmarks have many issues. Dynabench offers a
          more accurate and sustainable way for evaluating progress in AI.
        </h2>
      </div>
      <div className="mt-5">
        <p>
          Benchmarks &mdash; from{" "}
          <a href="http://yann.lecun.com/exdb/mnist/" target="_blank">MNIST</a>{" "}to{" "}
          <a href="http://www.image-net.org" target="_blank">ImageNet</a> to{" "}
          <a href="https://rajpurkar.github.io/SQuAD-explorer/" target="_blank">SQuAD</a>,{" "}
          <a href="https://nlp.stanford.edu/projects/snli/" target="_blank">SNLI</a> and{" "}
          <a href="https://gluebenchmark.com/" target="_blank">GLUE</a>{" "}
          &mdash; have played a hugely important role in driving progress in AI
          research. With the rapid pace of progress in the field, however, the
          current status quo is starting to show cracks. While it took us
          roughly 18 years to achieve "super human performance" on MNIST, the
          GLUE benchmark for natural language understanding was "solved" in less
          than a year after its inception. We believe{" "}
          <strong>
            the time is ripe to radically rethink the way we do benchmarking
          </strong>
          . With Dynabench, we can collect human-in-the-loop data dynamically,{" "}
          <i>against</i> the current state-of-the-art, in a way that more
          accurately measures progress, that cannot saturate and that can
          automatically fix annotation artifacts and other biases over time. This is meant to
          address the following challenges:
        </p>
        <ul>
          <li>
            <strong>Benchmarks saturate.</strong>
            <p>
              Our field is moving so quickly that benchmarks can saturate rather
              quickly. This is problematic, because benchmarks are actually
              designed to be long-lasting: they're meant to pose a challenging
              as-yet-unattainable goal to the community. Something that is quite
              far our of reach. When a benchmark saturates, we have to go in
              search of a new, better benchmark.
            </p>
          </li>
          <li>
            <strong>Benchmarks have artifacts.</strong>
            <p>
              There are well-documented cases of inadvertent biases that may be
              present in datasets. For example, you can get decent performance on
              SNLI by using <a href="https://arxiv.org/abs/1803.02324" target="_blank">just the hypothesis</a>.
              In VQA (visual question
              answering), the answer to a "how much" or "how many" question <a href="https://arxiv.org/abs/1612.00837" target="_blank">is
              usually "2"</a>. There might be <a href="https://arxiv.org/abs/2008.02637" target="_blank">unintended overlap</a> between train and test sets.
              Data biases are almost impossible to avoid, which may
              have very serious and potentially harmful side-effects.
            </p>
          </li>
          <li>
            <strong>Researchers overfit on benchmarks.</strong>
            <p>
              Benchmarks provide a useful common goal for the community to focus
              on, but that also means researchers may collectively overfit on
              specific tasks. Rather than keeping a clear focus on solving the
              bigger question, e.g. natural language understanding, researchers
              have built lucrative careers from cranking out percentage-point
              improvements to claim "SOTA" on established benchmarks.
            </p>
          </li>
          <li>
            <strong>Benchmarks can be deceiving.</strong>
            <p>
              Progress can be made in science by making sure we measure the
              right thing. High accuracy on a subfield's main benchmark may look
              impressive, especially to outsiders, but this can be deceiving:
              most researchers understand that achieving superhuman performance on SQuAD doesn't mean that Reading Comprehension is solved.
            </p>
          </li>
          <li>
            <strong>Aligning with humans.</strong>
            <p>
              Usually, we ultimately care not about a
              single benchmark, but about how well AI systems can work together
              with humans.  It is very important that AI objectives <a href="https://arxiv.org/abs/1805.00899" target="_blank">align with human values</a>.
The real metric for AI systems should be model error rate when interacting with a human.            </p>
          </li>
          <li>
            <strong>Embracing the loop.</strong>
            <p>
              Valuable time is lost when fields need to go in search of new
              benchmarks. The cyclical process of benchmarks saturating and getting
              replaced with newer ones &mdash; the "loop" of scientific progress
              &mdash; can be embraced to ensure we waste less time: by
              collecting data against the current state-of-the-art, the death of
              a saturated dynamic benchmark leads to the birth of a
              new, challenging benchmark.
            </p>
          </li>
          <li>
            <strong>Models are now good enough.</strong>
            <p>
              Benchmarks are static for historical reasons. Up until recently,
              we did not have crowdsourcing platforms and the capability to
              serve large-scale models for inference. They were expensive to
              collect, took a long time to saturate and models had a long way to
              go. Putting humans and models in the data collection loop together
              made little sense, since models were simply too brittle. With recent
              advances, however, we think models are good enough to be put in
              the loop with humans, to measure the problem we really care about:
              how well can AI systems work together with humans.
            </p>
          </li>
        </ul>
        <p>
          If embraced by the community, we can, together, try to change the way
          we evaluate our systems, overcome biases and make progress towards the
          grand goals of artificial intelligence research.
        </p>
      </div>
      <hr />
      <div className="mt-5 text-center">
        <h2 className="home-cardgroup-header d-block font-weight-light text-uppercase text-reset">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="mb-5">
        <h2 className="task-page-header d-block ml-0 mt-4 text-reset">
          Wait, what does this do exactly?
        </h2>
        <p>
          The basic idea is that we collect data dynamically. Humans are tasked
          with finding adversarial examples that fool current state-of-the-art
          models. This offers two benefits: it allows us to gauge how good our
          current SOTA methods really are; and it yields data that may be used
          to further train even stronger SOTA models. The process is repeated
          over multiple rounds: each time a round gets "solved" by the SOTA, we
          can take those models and adversarially collect a new dataset where
          they fail. Datasets will be released periodically as new examples are
          collected.
        </p>
        <h2 className="task-page-header d-block ml-0 mt-4 text-reset">
          Where can I read more?
        </h2>
        <p>
          This platform came out of our paper on{" "}
          <a href="https://arxiv.org/abs/1910.14599" target="_blank">
            Adversarial NLI: A New Benchmark for Natural Language Understanding
          </a>{" "}
          (NLI rounds 1-3). The idea is not new, of course: our work is heavily inspired by
          things like{" "}
          <a href="https://arxiv.org/abs/1606.01881" target="_blank">
            Build it, Break it, Fix it
          </a>{" "}
          and the awesome{" "}
          <a href="https://bibinlp.umiacs.umd.edu/" target="_blank">
            Build it, Break it: The Language Edition
          </a>{" "}
          shared task. There's related work on{" "}
          <a href="https://arxiv.org/abs/1711.07950" target="_blank">
            Mechanical Turker Descent
          </a>
          ,{" "}
          <a href="https://arxiv.org/abs/1908.06083" target="_blank">
            applying these ideas to dialogue safety
          </a>
          ,{" "}
          <a href="https://www.mitpressjournals.org/doi/full/10.1162/tacl_a_00279" target="_blank">
            trick me if you can
          </a>{" "}
          and the excellent{" "}
          <a href="https://arxiv.org/abs/2002.00293" target="_blank">Beat the AI</a> (QA round 1). There are
          lots of cool datasets out there that use similar ideas, especially
          when it comes to adversarial collection, like{" "}
          <a href="https://arxiv.org/abs/1808.05326" target="_blank">Swag</a>,{" "}
          <a href="https://arxiv.org/abs/1904.04365" target="_blank">CODAH</a>,{" "}
          <a href="https://hotpotqa.github.io/" target="_blank">HotpotQA</a> and of course{" "}
          <a href="https://arxiv.org/abs/1707.07328" target="_blank">Adversarial SQuAD</a>.
          Closely related concepts are{" "}
          <a href="https://arxiv.org/abs/2004.02709" target="_blank">contrast sets</a> and{" "}
          <a href="https://arxiv.org/abs/1909.12434" target="_blank">
            counterfactually-augmented data
          </a>
          .
        </p>
        <h2 className="task-page-header d-block ml-0 mt-4 text-reset">
          How can I help?
        </h2>
        <p>
          We need all the help we can get! Please <a href="mailto:dynabench@fb.com">reach out to us</a>. The community
          needs to have a say in what this platform becomes.
        </p>
        <h2 className="task-page-header d-block ml-0 mt-4 text-reset">
          Won't this lead to unnatural distributions and distributional shift?
        </h2>
        <p>
          It very well could, if we use collected data for training (the data could also only be used
          for evaluation). Another risk is catastrophic forgetting or cyclical
          "progress", where improved models forget things that were relevant in
          an earlier round. Research is required in trying to understand these
          shifts better, in characterizing how it might impact learning and in
          overcoming any adverse effects. Remember that Dynabench is a scientific experiment! A few
          things will help, however: we
          can make sure we don't shift in the direction of one particular model
          by using ensembles as adversarial targets, by validating collected
          examples with other humans and by not discarding data from older
          rounds. That said, it is unclear to what extent a statically collected
          crowdsourced datasets are more "natural".
        </p>
        <h2 className="task-page-header d-block ml-0 mt-4 text-reset">
          Will this actually work?
        </h2>
        <p>
          Good question! We won't know until we try. It's likely that we will
          require radical breakthroughs in model architectures to keep making
          progress. If anything, we might discover that we still have a long way
          to go.
        </p>
        <h2 className="task-page-header d-block ml-0 mt-4 text-reset">
          How do we compare results if the benchmark keeps changing?
        </h2>
        <p>
          Ultimately, that is for the community to decide and we don't want to
          enforce anything in particular. A suggestion could be that papers
          report results on numbered datasets, so e.g. "ANLI-1:3" for the first
          three rounds of NLI. If a new round comes out, as a community we will have to
          make sure existing state-of-the-art methods are evaluated on each round to
          facilitate a staggered comparison. We expect this to happen relatively organically.
        </p>
        <h2 className="task-page-header d-block ml-0 mt-4 text-reset">
          Where will this lead?
        </h2>
        <p>
          We hope that it will lead to more robust models, faster progress, a more well-defined objective, and a better
          understanding of our current limitations.
        </p>
        <h2 className="task-page-header d-block ml-0 mt-4 text-reset">
          Can I add my own task?
        </h2>
        <p>
          Hopefully, soon you will be able to add your own target models and
          your own tasks. Please stay tuned, and <a href="mailto:dynabench@fb.com">let us know</a> if you have any
          interesting proposals.
        </p>
        <h2 className="task-page-header d-block ml-0 mt-4 text-reset">
          What about other languages? Other modalities?
        </h2>
        <p>
          For now, Dynabench is English-only, but we are absolutely open to expanding to other languages. Similarly, for now we focus on NLP and text-only problems, but we are very interested in opening this up to other modalities.
        </p>
        <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
          What about annotators?
        </h2>
        <p>
          Anyone can use the platform to find or validate model-fooling examples. We hope to give linguists and other experts the tools they need to discover weaknesses in AI systems. We will also use crowdworkers to generate additional data, and to validate examples, in the same manner.
        </p>
        <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
          Why these tasks?
        </h2>
        <p>
          For now, we decided to focus on a limited set of "official" tasks
          because we think they cover a representative set of problems for NLP,
          that are well known and that people care about deeply. The idea is to
          open this up to any task that the community is interested in in the
          future.
        </p>
      </div>
      <hr />
      <div className="text-center">
        <h2 className="home-cardgroup-header d-block font-weight-light mb-4 text-uppercase text-reset">
          Have a question?
        </h2>
        <a href="mailto:dynabench@fb.com">
          <Button className="button-ellipse blue-bg home-readmore-btn border-0">
            Reach out to us
          </Button>
        </a>
      </div>
    </Col>
  </Container>
);

export default AboutPage;
