# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import argparse
from typing import List, NamedTuple, Optional, Sequence


class BadFile(NamedTuple):
    filename: str
    bad_line_number: int


def check_for_endwsith(
    filenames: Sequence[str],
) -> List[BadFile]:
    """Check if files contain bad CORS configurations."""
    bad_files = []

    for filename in filenames:
        if "cors" in filename and (filename != "detect_insecure_cors_configuration.py"):
            with open(filename) as content:
                text_lines = content.readlines()
                for i, txt_line in enumerate(text_lines):
                    if "endswith" in txt_line:
                        bad_files.append(BadFile(filename, i + 1))
    return bad_files


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("filenames", nargs="+", help="Filenames to run")
    args = parser.parse_args(argv)

    bad_filenames = check_for_endwsith(args.filenames)
    if bad_filenames:
        for bad_file in bad_filenames:
            print(
                f"`endswith` found in {bad_file.filename} on line number: "
                "{bad_file.bad_line_number}"
            )
        return 1
    else:
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
