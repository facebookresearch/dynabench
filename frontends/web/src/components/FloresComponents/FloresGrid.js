/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import Highcharts from "highcharts";
import highchartsHeatmap from "highcharts/modules/heatmap";
import HighchartsReact from "highcharts-react-official";
import highchartsBoost from "highcharts/modules/boost";

import "./FloresGrid.css";

highchartsHeatmap(Highcharts);
highchartsBoost(Highcharts);

const FloresGrid = (props) => {
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
      height: 720,
      width: 720,
      showAxes: true,
      //stacking: "overlap",
      spacing: [0, 0, 0, 0],
      //borderWidth: 1,
    },

    colorAxis: {
      min: 0,
      minColor: "#FFFFFF",
      maxColor: Highcharts.getOptions().colors[0],
    },

    xAxis: {
      categories: ["en_XX", "ru_RU", "ba_BA", "ar_AR", "al_AL", "hu_HU"],
    },

    yAxis: {
      categories: ["en_XX", "ru_RU", "ba_BA", "ar_AR", "al_AL", "hu_HU"],
      title: null,
      reversed: true,
    },

    title: {
      text: props.model.name || "Unknown",
    },

    legend: {
      enabled: false,
    },

    plotOptions: {
      heatmap: {
        color: "grey",
        crisp: false,
      },
    },

    tooltip: {
      formatter() {
        let self = this;
        console.log(self);
        const valuePoint = self.point.value;

        return (
          "<br> -------  ------- <br>" +
          "<b>" +
          getPointCategoryName(this.point, "y") +
          "-" +
          getPointCategoryName(this.point, "x") +
          ": " +
          "</b>" +
          valuePoint +
          "<br> -------  ------- <br>"
        );
      },
    },
    series: [
      {
        name: "Tags",
        borderWidth: 0.5,
        data: [
          [0, 0, ""],
          [0, 1, 34],
          [0, 2, 28],
          [0, 3, 24],
          [0, 4, 67],
          [0, 5, 47],
          [1, 0, 92],
          [1, 1, ""],
          [1, 2, 78],
          [1, 3, 90],
          [1, 4, 48],
          [1, 4, 38],
          [1, 5, 58],
          [2, 0, 35],
          [2, 1, 15],
          [2, 2, ""],
          [2, 3, 64],
          [2, 4, 52],
          [2, 5, 65],
          [3, 0, 72],
          [3, 1, 42],
          [3, 2, 84],
          [3, 3, ""],
          [3, 4, 16],
          [3, 5, 66],
          [4, 0, 38],
          [4, 1, 5],
          [4, 2, 8],
          [4, 3, 67],
          [4, 4, ""],
          [4, 5, 78],
          [5, 0, 72],
          [5, 1, 42],
          [5, 2, 84],
          [5, 3, 32],
          [5, 4, 16],
          [5, 5, ""],
        ],
        dataLabels: {
          enabled: true,
          color: "#000000",
        },
      },
    ],
  };

  return (
    <div className="scroll-wrapper">
      <div className="mr-auto ml-auto mt-4">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
    </div>
  );
};

export default FloresGrid;
