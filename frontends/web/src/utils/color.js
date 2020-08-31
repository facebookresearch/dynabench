/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const formatWordImportances = ({ words, importances }, target) => {
  if (importances && !importances.length) return "<td></td>";
  if (
    (words && !words.length) ||
    (words && words.length !== importances.length)
  )
    return "<td></td>";
  let tags = ["<td>"];
  words.map((word, i) => {
    const formatedWord = formatSpecialTokens(word);
    const color = getColor(importances[i], target);
    const unwrapped_tag = `<mark style="background-color: ${color}; opacity:1.0; 
                    line-height:1.75"><font color="black"> ${formatedWord}
                    </font></mark>`;
    tags.push(unwrapped_tag);
  });
  tags.push("</td>");
  return tags.join("");
};

const formatSpecialTokens = (word) => {
  if (word[0] === "<" && word[word.length - 1] === ">")
    return `#${word.slice(1, -1)}`;
  return word;
};

const getColor = (attr, target) => {
  attr = Math.max(-1, Math.min(1, attr));
  let hue = 0,
    sat = 75,
    lig = 0;
  if (target === "negative" || target === "hateful") {
    hue = attr > 0 ? 0 : 120;
    lig = 100 - parseInt((attr > 0 ? 40 : -50) * attr);
  } else {
    hue = attr > 0 ? 120 : 0;
    lig = 100 - parseInt((attr > 0 ? 50 : -40) * attr);
  }
  return `hsl(${hue}, ${sat}%, ${lig}%)`;
};
