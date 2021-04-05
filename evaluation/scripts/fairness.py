import os
import random

from util import postprocess, preprocess


class FairnessPerturbation:
    def __init__(self):
        # initialize perturbation lists.
        self.fdir = "../data/"
        self.gender_name_list = self.load_gender_name_list()
        self.gender_word_list = self.load_gender_word_list()
        self.ethnic_name_list = self.load_ethnic_name_list()
        return

    def load_gender_name_list(self):
        male_words = os.path.join(self.fdir, "male_word_file.txt")
        female_words = os.path.join(self.fdir, "female_word_file.txt")

        with open(male_words, "r") as f:
            male = f.read().splitlines()

        with open(female_words, "r") as f:
            female = f.read().splitlines()

        # build random pairs
        gendered_list = {}
        n_pairs = min(len(male), len(female))
        for i in range(n_pairs):
            gendered_list[male[i]] = female[i]
            gendered_list[female[i]] = male[i]

        return gendered_list

    def load_gender_word_list(self):
        male_names = os.path.join(self.fdir, "male_names.txt")
        female_names = os.path.join(self.fdir, "female_names.txt")

        with open(male_names, "r") as f:
            male = f.read().splitlines()

        with open(female_names, "r") as f:
            female = f.read().splitlines()

        name_list = {}
        random.shuffle(female)
        for i in range(len(female)):
            # more female names than male names
            if i < len(male):
                name_list[female[i]] = male[i]
                name_list[male[i]] = female[i]
            else:
                name_list[female[i]] = male[i - len(male)]

        return name_list

    def load_ethnic_name_list(self):
        folder = self.fdir
        white_names = os.path.join(folder, "white_names.txt")
        black_names = os.path.join(folder, "black_names.txt")
        api_names = os.path.join(folder, "api_names.txt")
        hisp_names = os.path.join(folder, "hispanic_names.txt")

        white_name_list = open(white_names, "rt").read().split(", ")
        black_name_list = open(black_names, "rt").read().split(", ")
        api_name_list = open(api_names, "rt").read().split(", ")
        hisp_name_list = open(hisp_names, "rt").read().split(", ")
        all_names = [white_name_list, black_name_list, api_name_list, hisp_name_list]

        # build random pairs
        ethnic_name_list = {}
        for i in range(len(all_names)):
            for name in all_names[i]:
                new_group = i
                while new_group == i:
                    new_group = random.randint(0, 3)
                lenn = len(all_names[new_group])
                idx = random.randint(0, lenn - 1)
                ethnic_name_list[name] = all_names[new_group][idx]

        return ethnic_name_list

    def perturb(self, task, example):
        perturbed = []
        # gender perturb
        pt_example = self.perturb_gender(task, example)
        if pt_example:
            perturbed.append(pt_example)
        # ethnic names perturb
        pt_example = self.perturb_ethnic(task, example)
        if pt_example:
            perturbed.append(pt_example)

        return perturbed

    def perturb_gender(self, task, example):
        perturb_example = example
        perturb_example["input_id"] = example["uid"]
        # perturb context for all tasks
        context = example["context"]
        pt_context, changed = self.perturb_gender_text(context)
        perturb_example["context"] = pt_context
        # perturb additional fields for task "qa" and "nli"
        if task == "qa":
            question = example["question"]
            pt_question, changed_question = self.perturb_gender_text(question)
            perturb_example["question"] = pt_question
            changed = changed or changed_question
        elif task == "nli":
            hypothesis = example["hypothesis"]
            pt_hypothesis, changed_hypothesis = self.perturb_gender_text(hypothesis)
            perturb_example["hypothesis"] = pt_hypothesis
            changed = changed or changed_hypothesis

        if changed:
            return perturb_example

        return None

    def perturb_ethnic(self, task, example):
        perturb_example = example
        perturb_example["input_id"] = example["uid"]
        context = example["context"]
        pt_context, changed = self.perturb_ethnic_text(context)
        perturb_example["context"] = pt_context
        if task == "qa":
            question = example["question"]
            pt_question, changed_question = self.perturb_ethnic_text(question)
            perturb_example["question"] = pt_question
            changed = changed or changed_question
        elif task == "nli":
            hypothesis = example["hypothesis"]
            pt_hypothesis, changed_hypothesis = self.perturb_ethnic_text(hypothesis)
            perturb_example["hypothesis"] = pt_hypothesis
            changed = changed or changed_hypothesis

        if changed:
            return perturb_example

        return None

    def perturb_gender_text(self, text):
        text = preprocess(text)
        perturb_text = []
        changed = False
        for tok in text.split():
            new_name = self.gender_name_list.get(tok, None)
            if new_name is not None:
                perturb_text.append(new_name)
                changed = True
                continue

            new_tok = self.gender_word_list.get(tok.lower(), None)
            if new_tok is not None:
                if tok[0].isupper():
                    new_tok = new_tok.capitalize()
                perturb_text.append(new_tok)
                changed = True
            else:
                perturb_text.append(tok)

        return postprocess(" ".join(perturb_text)), changed

    def perturb_ethnic_text(self, text):
        text = preprocess(text)
        perturb_text = []
        changed = False
        for tok in text.split(" "):
            new_name = self.ethnic_name_list.get(tok, None)
            if new_name is not None:
                perturb_text.append(new_name)
                changed = True
            else:
                perturb_text.append(tok)

        return postprocess(" ".join(perturb_text)), changed
