# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

FROM ubuntu:18.04

ENV PYTHONUNBUFFERED TRUE

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
    fakeroot \
    ca-certificates \
    dpkg-dev \
    g++ \
    python3-dev \
    openjdk-11-jdk \
    curl \
    vim \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && cd /tmp \
    && curl -O https://bootstrap.pypa.io/get-pip.py \
    && python3 get-pip.py

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1
RUN update-alternatives --install /usr/local/bin/pip pip /usr/local/bin/pip3 1

RUN pip install aiohttp
RUN pip install zmq
RUN pip install fairseq
RUN pip install captum
RUN pip install unidecode


RUN pip install --no-cache-dir psutil \
                --no-cache-dir torch \
                --no-cache-dir torchvision

RUN pip install transformers==4.5.1
ADD serve serve
RUN pip install ../serve/

COPY dockerd-entrypoint.sh /usr/local/bin/dockerd-entrypoint.sh
RUN chmod +x /usr/local/bin/dockerd-entrypoint.sh

RUN mkdir -p /home/model-server/ && mkdir -p /home/model-server/tmp
COPY config.properties /home/model-server/config.properties

WORKDIR /home/model-server
ENV TEMP=/home/model-server/tmp

ADD anli-private /home/model-server/anli-old
ADD anli-public /home/model-server/anli

ENV PYTHONIOENCODING=UTF-8
ENTRYPOINT ["/usr/local/bin/dockerd-entrypoint.sh"]
CMD ["serve"]
