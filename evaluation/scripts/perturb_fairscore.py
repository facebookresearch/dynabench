from fairness import FairnessPerturbation
import argparse
import json
import csv

def load_examples(path):
    with open(path) as f:
        return [json.loads(line) for line in f]

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--local_path",
        type=str,
        default="",
        help=(
            "Local path to a .jsonl file containing NLI examples"
        ),
    )
    args = parser.parse_args()
    print(args.local_path)

    orig_csv_writer = csv.writer(open("mnli_unchanged_examples.csv", "w"), delimiter="|")
    orig_csv_writer.writerow(["Original"])

    # Save the perturbed data samples
    perturbed_pairs = []
    with open("fairness_dataset.csv", "w") as csvfile:
        csv_writer = csv.writer(csvfile, delimiter="|")
        csv_writer.writerow(["Original", "Perturbed"])

        pert = FairnessPerturbation()
        orig_examples = load_examples(args.local_path)
        for example in orig_examples:
            # print("Original:")
            # print(example)
            # print("Perturbed:")
            perturbed = pert.perturb("nli", example)
            if len(perturbed) == 0:
                # print("Nothing to perturb")
                orig_csv_writer.writerow([example["context"]])
                orig_csv_writer.writerow([example["hypothesis"]])
                continue
            # print(perturbed)
            # with open("fairness_dataset.csv", "w") as csvfile:
            # csv_writer = csv.writer(csvfile, delimiter="|")
            # csv_writer.writerow(example)
            # csv_writer.writerow(perturbed[0])
            csv_writer.writerow([example["context"], perturbed[0]["context"]])
            csv_writer.writerow([example["hypothesis"], perturbed[0]["hypothesis"]])

        
        





