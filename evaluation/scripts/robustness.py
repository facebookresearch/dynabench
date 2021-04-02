# Typo attack function from:
# https://github.com/danishpruthi/Adversarial-Misspellings

import numpy as np
from collections import defaultdict

class RobustnessPerturbation:
    def __init__(self):
        # initialize keyboard mappings
        keyboard_mappings = defaultdict(lambda: [])
        keyboard = ["qwertyuiop", "asdfghjkl*", "zxcvbnm***"]
        row = len(keyboard)
        col = len(keyboard[0])

        dx = [-1, 1, 0, 0]
        dy = [0, 0, -1, 1]

        for i in range(row):
            for j in range(col):
                for k in range(4):
                    x_, y_ = i + dx[k], j + dy[k]
                    if (x_ >= 0 and x_ < row) and (y_ >= 0 and y_ < col):
                        if keyboard[x_][y_] == '*': continue
                        if keyboard[i][j] == '*': continue
                        keyboard_mappings[keyboard[i][j]].append(keyboard[x_][y_])
        self.keyboard_mappings = keyboard_mappings
        return

    # TODO: add more perturbation functions
    def perturb(self, task, example):
        perturbed = []
        # typo perturb
        pt_example = self.perturb_typo(task, example)
        if pt_example:
            perturbed.append(pt_example)

        return perturbed

    def perturb_typo(self, task, example):
        perturb_example = example
        perturb_example['input_id'] = example['uid']
        context = example['context']
        pt_context, changed = self.perturb_typo_text(context)
        perturb_example['context'] = pt_context
        if task == "qa":
            question = example['question']
            pt_question, changed_question = self.perturb_typo_text(question)
            perturb_example['question'] = pt_question
            changed = changed or changed_question
        elif task == "nli":
            hypothesis = example['hypothesis']
            pt_hypothesis, changed_hypothesis = self.perturb_typo_text(hypothesis) 
            perturb_example['hypothesis'] = pt_hypothesis
            changed = changed or changed_hypothesis

        if changed:
            return perturb_example

        return None

    def perturb_typo_text(self, text):
        num_perturb = int(float(len(text)) * 0.02)
        changed = False
        for i in range(num_perturb):
            perturb_text = self.get_random_attack(text, num_perturb)
            if perturb_text:
                changed = True
                text = perturb_text
        
        return text, changed

    def get_random_attack(self, line, num_tries):
        num_chars = len(line)

        for _ in range(num_tries):
            char_idx = np.random.choice(range(num_chars), 1)[0]
            if self.is_valid_attack(line, char_idx):
                attack_type = ['swap', 'drop', 'add', 'key']
                attack_probs = np.array([1.0, 1.0, 1.0, 1.0])
                attack_probs = attack_probs/sum(attack_probs)
                attack = np.random.choice(attack_type, 1, p=attack_probs)[0]
                if attack == 'swap':
                    return line[:char_idx] + line[char_idx:char_idx+2][::-1] + line[char_idx+2:]
                elif attack == 'drop':
                    return line[:char_idx] + line[char_idx+1:]
                elif attack == 'key':
                    sideys = self.get_keyboard_neighbors(line[char_idx])
                    new_ch = np.random.choice(sideys, 1)[0]
                    return line[:char_idx] + new_ch + line[char_idx+1:]
                else: # attack type is add
                    alphabets = "abcdefghijklmnopqrstuvwxyz"
                    alphabets = [ch for ch in alphabets]
                    new_ch = np.random.choice(alphabets, 1)[0]
                    return line[:char_idx] + new_ch + line[char_idx:]
        return None

    def is_valid_attack(self, line, char_idx):
        line = line.lower()
        if char_idx == 0 or char_idx == len(line) - 1:
            # first and last chars of the sentence
            return False
        if line[char_idx-1] == ' ' or line[char_idx+1] == ' ':
            # first and last chars of the word
            return False
        # anything not a legit alphabet
        if not('a' <= line[char_idx] <= 'z'):
            return False

        return True

    def get_keyboard_neighbors(self, ch):
        if ch not in self.keyboard_mappings: return [ch]
        return self.keyboard_mappings[ch]
