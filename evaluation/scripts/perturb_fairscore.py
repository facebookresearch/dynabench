from augly_perturbation import AuglyPerturbation
from textflint import UTSample
from textflint.generation.transformation.UT.prejudice import Prejudice
import argparse
import json
import csv

def load_examples(path):
    with open(path) as f:
        return [json.loads(line) for line in f]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--local_path",
        type=str,
        default="o",
        help=(
            "Local path to a .jsonl file containing annotator and perturber rewrites"
        ),
    )
    parser.add_argument(
        "--output_file",
        type=str,
        default="03-05-allowlist-test-set-gender.csv",
        help=(
            "Local path to a .jsonl file containing annotator and perturber rewrites"
        ),
    )
    args = parser.parse_args()

    orig_examples = load_examples(args.local_path)

    pert = AuglyPerturbation(perturb_prefix="fairness", seed=2000, num_threads=1, perturb_fields=["original"], ignore_words_fields=[])
    perturbed_examples = pert.perturb(orig_examples)
    for ex in orig_examples:
        ex["x"] = ex["original"]
        sample = UTSample(ex)
        trans = Prejudice(change_type="Name")
        trans_sample = trans.transform(sample)
        if trans_sample == []:
            ex["textflint_rewrite"] = ex["original"]
        else:
            textflint_rewrite = trans_sample[0].dump()
            ex["textflint_rewrite"] = textflint_rewrite["x"]

    with open(args.output_file, "w") as csvfile:
        csv_writer = csv.writer(csvfile, delimiter="|")
        csv_writer.writerow(["original", "text_with_params", "augly_rewrite", "textflint_rewrite", "perturber_rewrite", "annotator_rewrite"])
        for orig, example in zip(orig_examples, perturbed_examples):
            if len(example) == 0:
                csv_writer.writerow([orig["original"], orig["text_with_params"], orig["original"], orig["textflint_rewrite"], orig["perturber_rewrite"], orig["annotator_rewrite"]])
                continue
            csv_writer.writerow([orig["original"], orig["text_with_params"], example[0]["original"], orig["textflint_rewrite"], orig["perturber_rewrite"], example[0]["annotator_rewrite"]])

    
if __name__ == "__main__":
    main()