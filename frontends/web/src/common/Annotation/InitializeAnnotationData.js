/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function initializeData(data, annotationConfigObj) {
  if (annotationConfigObj.type === "target_label") {
    const random =
      annotationConfigObj.constructor_args.labels[
        Math.floor(
          Math.random() * annotationConfigObj.constructor_args.labels.length
        )
      ];
    data[annotationConfigObj.name] = random;
  } else {
    data[annotationConfigObj.name] = null;
  }
}
