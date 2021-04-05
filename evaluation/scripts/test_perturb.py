from perturb import perturb


path = "/private/home/ledell/fairness/mnli/mnli-dev-matched.jsonl"
examples = perturb(path, "nli", "robustness")
print(len(examples))
print(examples[:10])
