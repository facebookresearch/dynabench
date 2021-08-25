# How to add new tasks/rounds

1. Add a config file to `configs/` and add the secret to `secrets.json` if applicable
2. Create a `tasks/[task]/r[round]/` directory
3. Create a `handler.py` file in that directory
4. Test your setup via `python testhandler.py configs/path-to-config.json` (add `--inspect` to test interpretability)
5. Deploy via `python deploy.py configs/path-to-config.json`
