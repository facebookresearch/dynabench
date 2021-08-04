#!/usr/bin/env python3
# Copyright (c) Facebook, Inc. and its affiliates.

import os  # noqa
import sys  # noqa
import json # noqa
import argparse

import pandas as pd  # noqa
from mephisto.abstractions.databases.local_database import LocalMephistoDB
from mephisto.data_model.unit import Unit
from mephisto.data_model.worker import Worker
from mephisto.tools.data_browser import DataBrowser as MephistoDataBrowser


if os.path.exists("./Mephisto"):  # noqa
    sys.path.append(os.path.abspath("./Mephisto"))  # noqa
    print("WARNING: Loading Mephisto from local directory")  # noqa


BONUS = 0.50
HIT_PRICE = 1.00

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Paying Bonuses")
    parser.add_argument("--pay", action="store_true", default=False)
    args, remaining_args = parser.parse_known_args()
    assert remaining_args == [], remaining_args

    # parsed_validations = pd.read_csv(
    #     input("Enter name of the file outputted by your processing script "), sep="\t"
    # )

    val_file_path = "annotated_data/val.pkl"
    parsed_validations = pd.read_pickle(val_file_path)

    # Check how many to manually validated per annotator
    annotator_ids = parsed_validations.annotator_id.unique().tolist()
    examples_per_annotator = {}
    for x in annotator_ids:
        examples_per_annotator[x] = {
            "approved": len(parsed_validations[(parsed_validations.annotator_id == x) & (parsed_validations.val_approved == "yes")]),
            "validated": len(parsed_validations[(parsed_validations.annotator_id == x) & (parsed_validations.val_approved != "empty")]),
            "total": len(parsed_validations[parsed_validations.annotator_id == x]),
        }
        examples_per_annotator[x]["approval_rate"] = examples_per_annotator[x]["approved"] / examples_per_annotator[x]["validated"] if examples_per_annotator[x]["validated"] > 0 else 0

    # Process parsing
    def calculate_bonus(row):
        if examples_per_annotator[row.annotator_id]["approval_rate"] > 0 and \
            row["validated_by_annotator"] == "valid" and row["val_approved"] in ["yes", "empty"] and \
                json.loads(row['metadata_json']['fullresponse'])['eval_f1'] <= 0.8:
            return BONUS
        return 0.0

    parsed_validations["keep"] = "a"
    parsed_validations["sendbonus"] = parsed_validations.apply(calculate_bonus, axis=1)

    # Reduce to HITs
    assignment_ids = list(parsed_validations["assignment_id"].unique())
    parsed_val_dict = {
        i: {
            "id": i,
            "agentId": list(
                parsed_validations.loc[
                    parsed_validations["assignment_id"] == assignment_id
                ]["agent_id"].values
            )[0],
            "keep": "a",
            "sendbonus": parsed_validations.loc[
                parsed_validations["assignment_id"] == assignment_id
            ]["sendbonus"].sum(),
        }
        for i, assignment_id in enumerate(assignment_ids)
    }
    parsed_validations = pd.DataFrame.from_dict(parsed_val_dict).T

    print(f"Keeping {len(parsed_validations.loc[parsed_validations['keep'] == 'a'])} HITs")
    total_to_pay = HIT_PRICE * (
        len(parsed_validations.loc[parsed_validations["keep"] == "a"])
    )
    print(f"Paying approx ${total_to_pay:.2f}")
    print(f"Paying an additional ${parsed_validations['sendbonus'].sum():.2f} in bonuses")

    confirm = input("Proceed? (y/n): ")
    if str(confirm).lower() != "y":
        raise BaseException("Confirmation to proceed not adequately received.")


    disqualification_name = None
    # Change this to the name of your local qualification that you should
    # have already registered with MTurk and Mephisto

    db = LocalMephistoDB()
    mephisto_data_browser = MephistoDataBrowser(db=db)

    DO_REVIEW = True
    AUTO_REJECT = True


    def format_for_printing_data(data):
        # Custom tasks can define methods for how to display their data in a
        # relevant way
        worker_name = Worker(db, data["worker_id"]).worker_name
        contents = data["data"]
        duration = contents["times"]["task_end"] - contents["times"]["task_start"]
        duration = int(duration)
        metadata_string = (
            f"Worker: {worker_name}\nUnit: {data['unit_id']}\n"
            f"Duration: {duration}\nStatus: {data['status']}\n"
        )

        inputs = contents["inputs"]
        if inputs and len(inputs) > 0:
            inputs_string = (
                f"Character: {inputs['character_name']}\n"
                f"Description: {inputs['character_description']}\n"
            )
        else:
            inputs_string = "Character: None\nDescription: None\n"
        outputs = contents["outputs"]
        output_string = f"   Outputs: {outputs}\n"
        found_files = outputs.get("files")
        if found_files is not None:
            file_dir = Unit(db, data["unit_id"]).get_assigned_agent().get_data_dir()
            output_string += f"   Files: {found_files}\n"
            output_string += f"   File directory {file_dir}\n"
        else:
            output_string += "   Files: No files attached\n"
        return f"-------------------\n{metadata_string}{inputs_string}{output_string}"


    #### CONDITION WHETHER VALIDATION EXISTS

    num_approved = 0
    bonus_sent = 0

    for itr, agentId in enumerate(parsed_validations["agentId"]):
        unit_list = db.find_units(agent_id=int(agentId))
        if len(unit_list) == 0:
            continue
        unit = unit_list[0]
        if unit.get_assigned_agent() is None:
            continue
        if unit.get_status() == "completed":
            try:
                print(
                    format_for_printing_data(mephisto_data_browser.get_data_from_unit(unit))
                )
            except Exception as e:
                print(e.message)
                if unit.get_assigned_agent() is None:
                    continue
            keep = parsed_validations.loc[itr, "keep"]
            sendbonus = parsed_validations.loc[itr, "sendbonus"]
            if keep == "a":
                unit.get_assigned_agent().approve_work()
                num_approved += 1
                sendbonus = round(sendbonus, 2)
                if sendbonus > 0:
                    try:
                        if args.pay:
                            unit.get_assigned_agent().get_worker().bonus_worker(
                                amount=sendbonus,
                                reason="Bonus for validated questions that fooled the model",
                                unit=unit,
                            )
                            print(f"PAYMENT TO WORKER {agentId} PROCESSED")
                        bonus_sent += sendbonus
                    except Exception as e:
                        print(f"Could not bonus worker {agentId}")
                        print(f"Raised exception details: {e}")
                        print("---")
            elif keep == "r":
                if AUTO_REJECT:
                    reason = (
                        "We validated your work and over 3 out of 5 questions "
                        + "do not satisfy the instructions. Unfortunately we'll have "
                        + "to reject this HIT."
                    )
                else:
                    reason = input("Why are you rejecting this work?")
                unit.get_assigned_agent().reject_work(reason)
            elif keep == "p":
                # General best practice is to accept borderline work and then disqualify
                # the worker from working on more of these tasks
                agent = unit.get_assigned_agent()
                agent.soft_reject_work()
                sendbonus = round(sendbonus, 2)
                if sendbonus > 0:
                    try:
                        if args.pay:
                            unit.get_assigned_agent().get_worker().bonus_worker(
                                amount=sendbonus,
                                reason="Bonus for validated questions that fooled the model",
                                unit=unit,
                            )
                            print(f"PAYMENT TO WORKER {agentId} PROCESSED")
                        bonus_sent += sendbonus
                    except Exception as e:
                        print(f"Could not bonus worker {agentId}")
                        print(f"Raised exception details: {e}")
                        print("---")

                worker = agent.get_worker()
                worker.grant_qualification(disqualification_name, 1)
        else:
            continue

    cost = num_approved * HIT_PRICE
    print(f"{num_approved} HITs have been approved at a cost of ${cost:.2f}.")
    print(f"Additionally, ${bonus_sent:.2f} worth of bonuses have been sent.")
