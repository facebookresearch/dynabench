from augly_perturbation import AuglyPerturbation
from textflint import UTSample
from textflint.generation.transformation.UT.prejudice import Prejudice
from typing import Any, Dict, List, Optional, Tuple
import argparse
import json
import csv


def load_examples(path: str) -> List[Dict[str, Any]]:
    """Load examples in .jsonl format"""
    with open(path) as f:
        return [json.loads(line) for line in f]


def textflint_perturb_gender(examples: List[Dict[str, Any]]) -> None:
    """Run TextFlint gender swaps using the Prejudice transformation.

    Store outputs as `textflint_rewrite` and update rows in place.
    """
    for row in examples:
        # TextFlint requires field "x" to be set
        row["x"] = row["original"]
        # Initialize a Universal Transformation sample with the example
        sample = UTSample(row)
        # Name is the gender transform change type
        gender_transform = Prejudice(change_type="Name")
        transform_sample = gender_transform.transform(sample)
        if transform_sample == []:
            # If TextFlint did not detect any words to swap, use the original rewrite
            row["textflint_rewrite"] = row["original"]
        else:
            textflint_rewrite = transform_sample[0].dump()
            row["textflint_rewrite"] = textflint_rewrite["x"]


def write_perturb_outputs_to_csv(
    annotated_examples: List[Dict[str, Any]],
    augly_perturbed_examples: List[Dict[str, Any]],
    output_file: str,
) -> None:
    """Collate results from heuristic perturbation functions with original data and write to CSV path."""
    with open(output_file, "w") as csvfile:
        csv_writer = csv.writer(csvfile, delimiter="|")
        csv_writer.writerow(
            [
                "original",
                "text_with_params",
                "augly_rewrite",
                "textflint_rewrite",
                "perturber_rewrite",
                "annotator_rewrite",
            ]
        )
        for annotated_ex, augly_output in zip(
            annotated_examples, augly_perturbed_examples
        ):
            if len(augly_output) == 0:
                csv_writer.writerow(
                    [
                        annotated_ex["original"],
                        annotated_ex["text_with_params"],
                        annotated_ex["original"],
                        annotated_ex["textflint_rewrite"],
                        annotated_ex["perturber_rewrite"],
                        annotated_ex["annotator_rewrite"],
                    ]
                )
                continue
            csv_writer.writerow(
                [
                    annotated_ex["original"],
                    annotated_ex["text_with_params"],
                    augly_output[0]["original"],
                    annotated_ex["textflint_rewrite"],
                    annotated_ex["perturber_rewrite"],
                    annotated_ex["annotator_rewrite"],
                ]
            )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--local_path",
        type=str,
        required=True,
        help=(
            "Local path to a .jsonl file containing annotator and perturber rewrites"
        ),
    )
    parser.add_argument(
        "--output_file",
        type=str,
        required=True,
        help=(
            "Path to a .csv file to save heuristically perturbed outputs"
        ),
    )
    args = parser.parse_args()

    annotated_examples = load_examples(args.local_path)

    # Run AugLy perturbations on original text fields
    pert = AuglyPerturbation(
        perturb_prefix="fairness",
        seed=2000,
        num_threads=1,
        perturb_fields=["original"],
        ignore_words_fields=[],
    )
    augly_perturbed_examples = pert.perturb(annotated_examples)

    textflint_perturb_gender(annotated_examples)

    write_perturb_outputs_to_csv(
        annotated_examples, augly_perturbed_examples, args.output_file
    )


if __name__ == "__main__":
    main()
