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

import "./FloresGrid.css";

highchartsHeatmap(Highcharts);
highchartsBoost(Highcharts);
highchartsCluster(Highcharts);

const FloresGrid = ({ model }) => {
  const [dummyData, setData] = useState([]);

  useEffect(() => {
    setData(generateData());
  }, []);

  const generateData = () => {
    let result = [];
    for (var i = 0; i < 100; i++) {
      for (var j = 0; j < 100; j++) {
        if (i === j) {
          result.push([i, j, null]);
        } else {
          result.push([i, j, Math.floor(Math.random() * (99 - 10 + 1)) + 10]);
        }
      }
    }
    return result;
  };

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
      height: dummyData.length < 50 ? 600 : 1500,
      width: dummyData.length < 50 ? 700 : 1520,
      showAxes: true,
      spacing: [0, 0, 0, 0],
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
      categories: [
        "af",
        "ak",
        "sq",
        "am",
        "ar",
        "hy",
        "rup_MK",
        "as",
        "az",
        "az_TR",
        "ba",
        "eu",
        "bel",
        "bn_BD",
        "bs_BA",
        "bg_BG",
        "my_MM",
        "ca",
        "bal",
        "zh_CN",
        "zh_HK",
        "zh_TW",
        "co",
        "hr",
        "cs_CZ",
        "da_DK",
        "dv",
        "nl_NL",
        "nl_BE",
        "en_US",
        "en_AU",
        "en_CA",
        "en_GB",
        "eo",
        "et",
        "fo",
        "fi",
        "fr_BE",
        "fr_FR",
        "fy",
        "fuc",
        "gl_ES",
        "ka_GE",
        "de_DE",
        "de_CH",
        "el",
        "gn",
        "gu_IN",
        "haw_US",
        "haz",
        "he_IL",
        "hi_IN",
        "hu_HU",
        "is_IS",
        "ido",
        "id_ID",
        "ga",
        "it_IT",
        "ja",
        "jv_ID",
        "kn",
        "kk",
        "km",
        "kin",
        "ky_KY",
        "ko_KR",
        "ckb",
        "lo",
        "lv",
        "li",
        "lin",
        "lt_LT",
        "lb_LU",
        "mk_MK",
        "mg_MG",
        "ms_MY",
        "ml_IN",
        "mr",
        "xmf",
        "mn",
        "me_ME",
        "ne_NP",
        "nb_NO",
        "nn_NO",
        "ory",
        "os",
        "ps",
        "fa_IR",
        "fa_AF",
        "pl_PL",
        "pt_BR",
        "pt_PT",
        "pa_IN",
        "rhg",
        "ro_RO",
        "ru_RU",
        "ru_UA",
        "rue",
        "sah",
        "sa_IN",
        "srd",
        "gd",
        "sr_RS",
        "sd_PK",
        "si_LK",
        "sk_SK",
        "sl_SI",
        "so_SO",
        "azb",
        "es_AR",
        "es_CL",
        "es_CO",
        "es_MX",
        "es_PE",
        "es_PR",
        "es_ES",
        "es_VE",
        "su_ID",
        "sw",
        "sv_SE",
        "gsw",
        "tl",
        "tg",
        "tzm",
        "ta_IN",
        "ta_LK",
        "tt_RU",
        "te",
        "th",
        "bo",
        "tir",
        "tr_TR",
        "tuk",
        "ug_CN",
        "uk",
        "ur",
        "uz_UZ",
        "vi",
        "wa",
        "cy",
        "yor",
      ],
    },

    yAxis: {
      categories: [
        "af",
        "ak",
        "sq",
        "am",
        "ar",
        "hy",
        "rup_MK",
        "as",
        "az",
        "az_TR",
        "ba",
        "eu",
        "bel",
        "bn_BD",
        "bs_BA",
        "bg_BG",
        "my_MM",
        "ca",
        "bal",
        "zh_CN",
        "zh_HK",
        "zh_TW",
        "co",
        "hr",
        "cs_CZ",
        "da_DK",
        "dv",
        "nl_NL",
        "nl_BE",
        "en_US",
        "en_AU",
        "en_CA",
        "en_GB",
        "eo",
        "et",
        "fo",
        "fi",
        "fr_BE",
        "fr_FR",
        "fy",
        "fuc",
        "gl_ES",
        "ka_GE",
        "de_DE",
        "de_CH",
        "el",
        "gn",
        "gu_IN",
        "haw_US",
        "haz",
        "he_IL",
        "hi_IN",
        "hu_HU",
        "is_IS",
        "ido",
        "id_ID",
        "ga",
        "it_IT",
        "ja",
        "jv_ID",
        "kn",
        "kk",
        "km",
        "kin",
        "ky_KY",
        "ko_KR",
        "ckb",
        "lo",
        "lv",
        "li",
        "lin",
        "lt_LT",
        "lb_LU",
        "mk_MK",
        "mg_MG",
        "ms_MY",
        "ml_IN",
        "mr",
        "xmf",
        "mn",
        "me_ME",
        "ne_NP",
        "nb_NO",
        "nn_NO",
        "ory",
        "os",
        "ps",
        "fa_IR",
        "fa_AF",
        "pl_PL",
        "pt_BR",
        "pt_PT",
        "pa_IN",
        "rhg",
        "ro_RO",
        "ru_RU",
        "ru_UA",
        "rue",
        "sah",
        "sa_IN",
        "srd",
        "gd",
        "sr_RS",
        "sd_PK",
        "si_LK",
        "sk_SK",
        "sl_SI",
        "so_SO",
        "azb",
        "es_AR",
        "es_CL",
        "es_CO",
        "es_MX",
        "es_PE",
        "es_PR",
        "es_ES",
        "es_VE",
        "su_ID",
        "sw",
        "sv_SE",
        "gsw",
        "tl",
        "tg",
        "tzm",
        "ta_IN",
        "ta_LK",
        "tt_RU",
        "te",
        "th",
        "bo",
        "tir",
        "tr_TR",
        "tuk",
        "ug_CN",
        "uk",
        "ur",
        "uz_UZ",
        "vi",
        "wa",
        "cy",
        "yor",
      ],
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
      symbolHeight: dummyData.length < 50 ? 500 : 1200,
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
        boostThreshold: 100,
        turboThreshold: 100000,
        borderWidth: 0.3,
        nullColor: "#DCDCDC",
        data: generateData(),
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
