from augly_perturbation import AuglyPerturbation
import argparse
import json
import csv
import ast

def load_examples(path):
    with open(path) as f:
        return [json.loads(line) for line in f]

# def load_examples(path):
#     examples = []
#     with open(path) as f:
#         lines = f.readlines()
#         for row in lines:
#             task = ast.literal_eval(row)
#             examples.append(task)
#     return examples

# examples = [{"original": "she is a farmer Mary Jane her", "uid": 123}]
orig_examples = load_examples("/Users/rebeccaqian/fairscore/sst-sample-augly.jsonl")

pert = AuglyPerturbation(perturb_prefix="fairness", seed=2000, num_threads=1, perturb_fields=["original"], ignore_words_fields=[])
perturbed_examples = pert.perturb(orig_examples)
# print(perturbed_examples)

with open("augly_perturbed.csv", "w") as csvfile:
    csv_writer = csv.writer(csvfile, delimiter="|")
    csv_writer.writerow(["original", "augly_rewrite", "annotator_rewrite"])
    for orig, example in zip(orig_examples, perturbed_examples):
        if len(example) == 0:
            csv_writer.writerow([orig["original"], "", orig["annotator_rewrite"]])
            continue
        csv_writer.writerow([orig["original"], example[0]["original"], example[0]["annotator_rewrite"]])
#                 continue
#             # print(perturbed)
#             # with open("fairness_dataset.csv", "w") as csvfile:
#             # csv_writer = csv.writer(csvfile, delimiter="|")
#             # csv_writer.writerow(example)
#             # csv_writer.writerow(perturbed[0])
#             csv_writer.writerow([example["context"], perturbed[0]["context"]])
#             csv_writer.writerow([example["hypothesis"], perturbed[0]["hypothesis"]])
# if __name__ == "__main__":
#     parser = argparse.ArgumentParser()
#     parser.add_argument(
#         "--local_path",
#         type=str,
#         default="",
#         help=(
#             "Local path to a .jsonl file containing NLI examples"
#         ),
#     )
#     args = parser.parse_args()
#     print(args.local_path)

#     orig_csv_writer = csv.writer(open("mnli_unchanged_examples.csv", "w"), delimiter="|")
#     orig_csv_writer.writerow(["Original"])

#     # Save the perturbed data samples
#     perturbed_pairs = []
#     with open("fairness_dataset.csv", "w") as csvfile:
#         csv_writer = csv.writer(csvfile, delimiter="|")
#         csv_writer.writerow(["Original", "Perturbed"])

#         pert = AuglyPerturbation(perturb_prefix="fairness", seed=2000, num_threads=1, perturb_fields=["original"], ignore_words_fields=["annotator_rewrite"])
#         orig_examples = load_examples(args.local_path)
#         import ipdb; ipdb.set_trace()
#         for example in orig_examples:
#             # print("Original:")
#             # print(example)
#             # print("Perturbed:")
#             perturbed = pert.perturb("nli", example)
#             if len(perturbed) == 0:
#                 # print("Nothing to perturb")
#                 orig_csv_writer.writerow([example["context"]])
#                 orig_csv_writer.writerow([example["hypothesis"]])
#                 continue
#             # print(perturbed)
#             # with open("fairness_dataset.csv", "w") as csvfile:
#             # csv_writer = csv.writer(csvfile, delimiter="|")
#             # csv_writer.writerow(example)
#             # csv_writer.writerow(perturbed[0])
#             csv_writer.writerow([example["context"], perturbed[0]["context"]])
#             csv_writer.writerow([example["hypothesis"], perturbed[0]["hypothesis"]])

            # ex = [{"uid": "960", "col": "She is a farmer Mary Jane her. Still Standing is a song by American R&B singer Monica, written by Christopher Bridges, Adonis Shropshire, Bryan-Michael Cox and Monica for her sixth studio album, \"Still Standing\" (2010). Produced by Bryan-Michael Cox, it features guest vocals by her cousin and rapper Ludacris. Still Standing has been heard by trump", "annotator_rewrite": "``Still Standing'' is a song by American R & B singer Mark, written by Christopher Bridges, Adonis Shropshire, Bryan-Michael Cox and Mark for his sixth studio album , `` Still Standing'' ( 2010 ) . Produced by Bryan-Michael Cox, it features guest vocals by her cousin and rapper Ludacris . Still Standing has been heard by trump. She is a farmer Mary Jane her"}]