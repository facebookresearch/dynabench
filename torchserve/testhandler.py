import argparse
import os
import sys
sys.path.insert(0, 'common')
sys.path.append('tasks/nli/anli/src')

from deploy import load_config, setup_model, generate_settings_file

class Context(object):
    def __init__(self, config):
        fname = config['model_path'].split("/")[-1]
        if config['task'] == 'nli':
            self.manifest = {"model": {"serializedFile": fname}}
        else:
            self.manifest = {"model": {"serializedFile": os.path.join(config['round_path'], fname)}}
        self.system_properties = {"model_dir": config['round_path']}
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
        import handler
        if config['task'] == 'qa':
            data = [{"body": { \
                "answer": "pretend you are reviewing a place", \
                "context": "Please pretend you are reviewing a place, product, book or movie", \
                "hypothesis": "What should i pretend?"
            }}]
        elif config['task'] == 'nli':
            data = [{"body": {
                "context": "Please pretend you are reviewing a place, product, book or movie",
                "hypothesis": "pretend you are reviewing a place",
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
