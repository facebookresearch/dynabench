/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import highchartsHeatmap from "highcharts/modules/heatmap";
import HighchartsReact from "highcharts-react-official";
import highchartsBoost from "highcharts/modules/boost";
import highchartsCluster from "highcharts/modules/marker-clusters";

import FloresLanguages from "./FloresLanguages";
import "./FloresGrid.css";

highchartsHeatmap(Highcharts);
highchartsBoost(Highcharts);
highchartsCluster(Highcharts);

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

const d1 = dummyLangs.map((s, i) => {
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

const FloresGrid = ({ model }) => {
  const [dummyData, setData] = useState([]);
  const [floresData, setFloresData] = useState([]);

  useEffect(() => {
    setData(d1);
  }, []);

  useEffect(() => {
    const perf_by_tag =
      model.leaderboard_scores[0].metadata_json &&
      JSON.parse(model.leaderboard_scores[0].metadata_json).hasOwnProperty(
        "perf_by_tag"
      )
        ? JSON.parse(model.leaderboard_scores[0].metadata_json)["perf_by_tag"]
        : [];
    setFloresData(perf_by_tag);
  }, [model]);

  const getPointCategoryName = (point, dimension) => {
    var series = point.series,
      isY = dimension === "y",
      axis = series[isY ? "yAxis" : "xAxis"];
    return axis.categories[point[isY ? "y" : "x"]];
  };

  const chartOptions = {
    marginTop: 0,
    marginBottom: 0,
    credits: {
      enabled: false,
    },
    chart: {
      type: "heatmap",
      height: dummyData.length < 50 ? 600 : 1000,
      width: dummyData.length < 50 ? 700 : 1020,
      showAxes: true,
      spacing: [0, 0, 0, 0],
      zoomType: "xy",
      panning: {
        enabled: true,
        type: "x",
      },
      panKey: "shift",
    },

    boost: {
      useGPUTranslations: true,
      usePreAllocated: true,
    },

    colorAxis: {
      min: 0,
      minColor: "#FFFFFF",
      maxColor: Highcharts.getOptions().colors[0],
    },

    xAxis: {
      categories: dummyLangs,
    },

    yAxis: {
      categories: dummyLangs,
      title: null,
      reversed: true,
    },

    title: {
      text: model.name || "Unknown",
    },
    legend: {
      enabled: true,
      align: "right",
      layout: "vertical",
      margin: 10,
      verticalAlign: "top",
      y: 75,
      symbolHeight: dummyData.length < 50 ? 500 : 800,
    },
    plotOptions: {
      heatmap: {
        color: "grey",
        crisp: false,
      },
    },

    tooltip: {
      followTouchMove: false,
      formatter() {
        let self = this;
        const source = FloresLanguages.find(
          (i) => i.ISO === getPointCategoryName(this.point, "y")
        );
        const target = FloresLanguages.find(
          (i) => i.ISO === getPointCategoryName(this.point, "x")
        );
        const valuePoint = self.point.value;

        return (
          `${source.LANGUAGE} (${getPointCategoryName(this.point, "y")})<br>` +
          `${target.LANGUAGE} (${getPointCategoryName(this.point, "x")})</br>` +
          "<b>Score: </b>" +
          valuePoint
        );
      },
    },

    series: [
      {
        name: "Tags",
        boostThreshold: 100,
        turboThreshold: 100000,
        borderWidth: 0.3,
        nullColor: "#DCDCDC",
        data: dummyData
          .flat(1)
          .map((a) => [a.sourceIndex, a.targetIndex, a.score]),
        dataLabels: {
          enabled: dummyData.length < 50 ? true : false,
          color: "#000",
        },
      },
    ],
  };

  return (
    <div className="scroll-wrapper">
      <div className="mr-auto ml-auto my-4 pb-1">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
    </div>
  );
};

export default FloresGrid;
