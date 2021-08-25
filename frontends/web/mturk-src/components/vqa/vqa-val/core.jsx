/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { VQAOnboarder } from "../src/Onboarding/VQAOnboarder.js";
import { VQAValidationInterface } from "../src/VQAValidationInterface.js";
import { VQAPreview } from "../src/VQAPreview.js";

class VQAValPreview extends React.Component {
  render() {
    return <VQAPreview previewMode="validation" />;
  }
}

class VQAValOnboarding extends React.Component {
  render() {
    return <VQAOnboarder {...this.props} onboardingMode="validation" />;
  }
}

class VQAValMain extends React.Component {
  render() {
    return <VQAValidationInterface {...this.props} />;
  }
}

export { VQAValPreview, VQAValOnboarding, VQAValMain };
