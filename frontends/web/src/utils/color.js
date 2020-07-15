export const formatWordImportances = ({ words, importances }) => {
  if (importances && !importances.length) return "<td></td>";
  if (
    (words && !words.length) ||
    (words && words.length !== importances.length)
  )
    return "<td></td>";
  let tags = ["<td>"];
  words.map((word, i) => {
    const formatedWord = formatSpecialTokens(word);
    const color = getColor(importances[i]);
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
    return `#${word.substring(1, word.length - 1)}`;
  return word;
};

const getColor = (attr) => {
  attr = Math.max(-1, Math.min(1, attr));
  let hue = 0,
    sat = 0,
    lig = 0;
  if (attr > 0) {
    hue = 120;
    sat = 75;
    lig = 100 - parseInt(50 * attr);
  } else {
    hue = 0;
    sat = 75;
    lig = 100 - parseInt(-40 * attr);
  }
  return `hsl(${hue}, ${sat}%, ${lig}%)`;
};
