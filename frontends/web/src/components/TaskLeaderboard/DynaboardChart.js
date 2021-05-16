import React from "react";
import Highcharts from "highcharts";
import highchartsParallelCoordinates from "highcharts/modules/parallel-coordinates";
import HighchartsReact from "highcharts-react-official";

highchartsParallelCoordinates(Highcharts);

const DynaboardChart = ({ models, metrics }) => {
  const options = {
    title: "",
    chart: {
      type: "spline",
      parallelCoordinates: true,
      parallelAxes: {
        lineWidth: 2,
      },
      displayErrors: true,
    },
    xAxis: {
      categories: [...metrics?.map((metric) => metric.label), "Dynascore"],
      offset: 10,
    },
    yAxis: [
      ...metrics?.map((metric, index) => {
        return {
          type: "linear",
          title: metric.label,
        };
      }),
      {
        type: "linear",
        title: "Dynascore",
      },
    ],
    series: models.map((m) => {
      return {
        id: m.id,
        name: m.model_name,
        data: [...m.averaged_scores, m.dynascore],
      };
    }),
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default DynaboardChart;
