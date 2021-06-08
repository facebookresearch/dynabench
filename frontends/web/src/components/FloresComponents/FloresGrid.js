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

const getDiagonal = (list) => {
  let unique = [];
  let distinct = [];
  for (let i = 0; i < list.length; i++) {
    if (!unique[list[i].tag.split("-")[0]]) {
      let tag = {
        tag: list[i].tag.split("-")[0] + "-" + list[i].tag.split("-")[0],
      };
      distinct.push(tag);
      unique[list[i].tag.split("-")[0]] = 1; // Enter a key value pair when non-existent
    }
  }
  return distinct;
};

const getDict = (list) => {
  let unique = [];
  let langDict = [];
  let langIndex = 0;
  for (let i = 0; i < list.length; i++) {
    if (!unique[list[i].tag.split("-")[0]]) {
      let lang_tag = { tag: list[i].tag.split("-")[0] };
      langDict.push(lang_tag);
      unique[list[i].tag.split("-")[0]] = 1; // Enter a key value pair when non-existent
    }
  }
  langDict.forEach((item) => (item.langIndex = langIndex++));
  return langDict;
};

const flatArray = (list) => {
  const diagonal = getDiagonal(list);
  const dict = getDict(list);
  let newList = [...list, ...diagonal];
  let min = 100;
  let max = 0;

  const chartData = newList.map((s, i) => {
    const objS = dict.find((o) => o.tag === s.tag.split("-")[0]);
    const objT = dict.find((t) => t.tag === s.tag.split("-")[1]);
    const score = Math.round(s.perf * 100) / 100 || null;
    min = Math.min(min, score ?? min);
    max = Math.max(max, score ?? max);
    return {
      source: s.tag.split("-")[0],
      target: s.tag.split("-")[1],
      perf: score,
      sourceIndex: objS.langIndex,
      targetIndex: objT.langIndex,
    };
  });
  return [chartData, min, max];
};

const FloresGrid = ({ model }) => {
  const [data, setChartData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [minScore, setMinScore] = useState();
  const [maxScore, setMaxScore] = useState();

  useEffect(() => {
    const perf_by_tag =
      model.leaderboard_scores[0].metadata_json &&
      JSON.parse(model.leaderboard_scores[0].metadata_json).hasOwnProperty(
        "perf_by_tag"
      )
        ? JSON.parse(model.leaderboard_scores[0].metadata_json)["perf_by_tag"]
        : [];

    const [chartData, min, max] = flatArray(perf_by_tag);
    setChartData(chartData);
    setMinScore(min);
    setMaxScore(max);
    setCategories(getDict(perf_by_tag).map((a) => a.tag));
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
      height: data.length < 50 ? 600 : 1000,
      width: data.length < 50 ? 700 : 1020,
      showAxes: true,
      spacing: [0, 0, 0, 0],
      zoomType: "xy",
      panning: {
        enabled: true,
        type: "x",
      },
      panKey: "shift",
      plotBorderWidth: 1,
      plotBorderColor: "#dddddd",
    },

    boost: {
      useGPUTranslations: true,
      usePreAllocated: true,
    },

    colorAxis: {
      min: minScore,
      max: maxScore,
      stops: [
        [0, "#ffffff"],
        [0.1, "#ffffff"],
        [0.2, "#caf0f8"],
        [0.3, "#ade8f4"],
        [0.4, "#90e0ef"],
        [0.5, "#48cae4"],
        [0.6, "#00b4d8"],
        [0.7, "#0096c7"],
        [0.8, "#0077b6"],
        [0.9, "#023e8a"],
        [1, "#03045e"],
      ],
    },

    xAxis: {
      categories: categories,
      endOnTick: false,
    },

    yAxis: {
      categories: categories,
      title: null,
      reversed: true,
      endOnTick: false,
    },

    title: {
      text: "FLORES Performance Grid (BLEU Score)",
    },
    legend: {
      enabled: true,
      align: "right",
      layout: "vertical",
      margin: 10,
      verticalAlign: "top",
      y: 75,
      symbolHeight: data.length < 50 ? 460 : 800,
    },
    plotOptions: {
      heatmap: {
        color: "grey",
        crisp: true,
      },
    },

    subtitle: {
      text: "Click and drag to zoom in.",
    },

    tooltip: {
      followTouchMove: false,
      formatter() {
        let self = this;
        const langSourceCode = getPointCategoryName(this.point, "y");
        const langTargetCode = getPointCategoryName(this.point, "x");
        const source =
          FloresLanguages.find((i) => i.ISO === langSourceCode) || {};
        const target =
          FloresLanguages.find((i) => i.ISO === langTargetCode) || {};
        const valuePoint = self.point.value;

        if (self.point.x === self.point.y) return "NA";

        return (
          `${source.LANGUAGE ?? langSourceCode} (${langSourceCode}) --> ` +
          `${target.LANGUAGE ?? langTargetCode} (${langTargetCode})</br>` +
          "<b>BLEU Score: </b>" +
          valuePoint
        );
      },
    },

    series: [
      {
        name: "Tags",
        boostThreshold: 100,
        turboThreshold: 100000,
        borderWidth: 0,
        nullColor: "#FFF",
        data: data.map((a) => [a.targetIndex, a.sourceIndex, a.perf]),
        dataLabels: {
          enabled: data.length < 50 ? true : false,
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
