# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import argparse
import os
import sys
sys.path.insert(0, 'common')

from deploy import load_config, setup_model, generate_settings_file

class Context(object):
    def __init__(self, config):
        fname = config['model_path'].split("/")[-1]
        if config['task'] == 'nli':
            self.manifest = {"model": {"serializedFile": fname}}
        else:
            self.manifest = {"model": {"serializedFile": os.path.join(config['round_path'], fname)}}
        self.system_properties = {"model_dir": config['round_path']}
        # Create symlinks for everything in model_dir to simulate the flattened structure when served
        round_model_files = [fname for fname in os.listdir(config['model_dir']) if not fname.startswith('.')]
        for fname in round_model_files:
            if not os.path.exists(os.path.join(config['round_path'], fname)):
                os.symlink(os.path.join(os.getcwd(), config['model_dir'], fname), os.path.join(config['round_path'], fname))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Dynabench Model Deployment")
    parser.add_argument("--inspect", action='store_true', default=False)
    parser.add_argument("configs", nargs='+')
    args, remaining_args = parser.parse_known_args()
    assert remaining_args == [], remaining_args

    for config_path in args.configs:
        if not os.path.exists(config_path):
            print(f"Error: Config {config_path} does not exist")
            quit()

        config = load_config(config_path)
        setup_model(config)
        generate_settings_file(config)
        print(config)
        sys.path.append(config['round_path'])
        if config['task'] == 'nli' and config['round_id'] in [1,2,3]:
            sys.path.append('tasks/nli/anli/src')
        elif config['task'] == 'nli':
            sys.path.append('tasks/nli/r4/anli-public/src')

        import handler
        if config['task'] == 'qa' or config['task'] == 'dk_qa':
            data = [{"body": { \
                "answer": "Vietnam War", \
                "context": "Vietnam War [ SEP ] The Vietnam War ( ) , also known as the Second Indochina War , and in Vietnam as the Resistance War Against America ( ) or simply the American War , was a conflict that occurred in Vietnam , Laos , and Cambodia from 1 November 1955 to the fall of Saigon on 30 April 1975 . It was the second of the Indochina Wars and was officially fought between North Vietnam and the government of South Vietnam . The North Vietnamese army was supported by the Soviet Union , China , and other communist allies ; the South Vietnamese army was supported by the United States , South Korea , the", \
                "hypothesis": "Another name for the Second Indochina war?"
            }}]
        elif config['task'] == 'nli':
            data = [{"body": {
                "context": "Old Trafford is a football stadium in Old Trafford, Greater Manchester, England, and the home of Manchester United. With a capacity of 75,643, it is the largest club football stadium in the United Kingdom, the second-largest football stadium, and the eleventh-largest in Europe. It is about 0.5 mi from Old Trafford Cricket Ground and the adjacent tram stop.",
                "hypothesis": "There is no club football stadium in England larger than the one in Manchester.",
                "target": 0
            }}]
        elif config['task'] == 'hs':
            data = [{"body": { \
                "context": "Please provide a hateful or not hateful statement",
                "hypothesis": "It is a good day",
                "target": 0
            }}]
        elif config['task'] == 'sentiment':
            data = [{"body": { \
                "context": "Please pretend you a reviewing a place, product, book or movie.",
                "hypothesis": "It is a good day",
                "target": 0
            }}]
        context = Context(config)
        if args.inspect:
            data[0]["body"]["insight"] = True
        else:
            data[0]["body"]["insight"] = False
        response = handler.handle(data, context)
        print(response)
