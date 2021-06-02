/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from "react";

import FloresLanguages from "./FloresLanguages";
import LanguageScoresMatrix from "./LanguageScoresMatrix";
import FloresLargeGridContainer from "./FloresLargeGridContainer";
import FloresGrid from "./FloresGrid";

const dummyLangs = [
  "amh",
  "ara",
  "hye",
  "asm",
  "ast",
  "aze",
  "bel",
  "ben",
  "bos",
  "bul",
  "mya",
  "cat",
  "ceb",
  "zho",
  "zho_trad",
  "hrv",
  "ces",
  "dan",
  "nld",
  "est",
  "tgl",
  "fin",
  "fra",
  "ful",
  "glg",
  "lug",
  "kat",
  "deu",
  "ell",
  "guj",
  "hau",
  "heb",
  "hin",
  "hun",
  "isl",
  "ibo",
  "ind",
  "gle",
  "ita",
  "jpn",
  "jav",
  "kea",
  "kam",
  "kan",
  "kaz",
  "khm",
  "kor",
  "kir",
  "lao",
  "lav",
  "lin",
  "lit",
  "luo",
  "ltz",
  "mkd",
  "msa",
  "mal",
  "mlt",
  "mri",
  "mar",
  "mon",
  "nep",
  "nso",
  "nor",
  "nya",
  "oci",
  "ory",
  "orm",
  "pus",
  "fas",
  "pol",
  "por",
  "pan",
  "ron",
  "rus",
  "srp",
  "sna",
  "snd",
  "slk",
  "slv",
  "som",
  "ckb",
  "spa",
  "swh",
  "swe",
  "tgk",
  "tam",
  "tel",
  "tha",
  "tur",
  "ukr",
  "umb",
  "urd",
  "uzb",
  "vie",
  "cym",
  "wol",
  "xho",
  "yor",
  "zul",
];

const dummyData = dummyLangs.map((s, i) => {
  return dummyLangs.map((t, j) => {
    return {
      source: s,
      target: t,
      score: i === j ? null : Math.floor(Math.random() * (99 - 10 + 1)) + 10,
      sourceIndex: i,
      targetIndex: j,
    };
  });
});

const FloresGridPicker = ({ model }) => {
  const [data, setData] = useState(dummyData);

  const useDummyData = true;

  // useEffect(() => {
  //   const perf_by_tag =
  //     model.leaderboard_scores[0].metadata_json &&
  //     JSON.parse(model.leaderboard_scores[0].metadata_json).hasOwnProperty(
  //       "perf_by_tag"
  //     )
  //       ? JSON.parse(model.leaderboard_scores[0].metadata_json)["perf_by_tag"]
  //       : [];
  //   if (useDummyData) {
  //     setData(dummyData);
  //   } else {
  //     setData(perf_by_tag);
  //   }
  // }, [model]);

  return (
    // <LanguageScoresMatrix scores={data} />
    <FloresLargeGridContainer data={data} />

    //   data.length <= 50 && (
    //     <FloresGrid model={model} />
    //   )
    // }
  );
};
export default FloresGridPicker;
