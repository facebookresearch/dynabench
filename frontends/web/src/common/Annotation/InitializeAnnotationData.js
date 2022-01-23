/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function initializeData(annotationConfigObjs) {
  const data = {};
  for (const annotationConfigObj of annotationConfigObjs) {
    if (annotationConfigObj.type === "target_label") {
      const random =
        annotationConfigObj.labels[
          Math.floor(Math.random() * annotationConfigObj.labels.length)
        ];
      data[annotationConfigObj.name] = random;
    } else {
      data[annotationConfigObj.name] = null;
    }
  }
  return data;
}
