import pickle


def load_queue_dump(path, logger=None):
    try:
        queue = pickle.load(open(path, "rb"))
        if logger:
            logger.info(f"Load existing queue from {path}.")
        return queue
    except FileNotFoundError:
        if logger:
            logger.info("No existing deployment queue found. Re-initializing...")
        return []
