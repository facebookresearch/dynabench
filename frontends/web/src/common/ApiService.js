/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import decode from "jwt-decode";
import * as download from 'downloadjs';

function delay(t, v) {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, v), t);
  });
}

export default class ApiService {
  constructor(domain) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      this.domain = domain || "https://dev.dynabench.org:8081";
    } else {
      this.domain = domain || "https://www.dynabench.org:8080";
    }

    this.fetch = this.fetch.bind(this);
    this.setToken = this.setToken.bind(this);
    this.getToken = this.getToken.bind(this);
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.getCredentials = this.getCredentials.bind(this);
    this.setMturkMode = this.setMturkMode.bind(this);
    this.updating_already = false;
    this.mode = 'normal';
  }

  setMturkMode() {
    this.mode = 'mturk';
  }

  login(email, password) {
    return this.fetch(`${this.domain}/authenticate`, {
      method: "POST",
      body: JSON.stringify({ email: email, password: password }),
    }).then((res) => {
      this.setToken(res.token);
      return res;
    });
  }

  register(email, password, username) {
    return this.fetch(`${this.domain}/users`, {
      method: "POST",
      body: JSON.stringify({
        email: email,
        password: password,
        username: username,
      }),
    }).then((res) => {
      this.setToken(res.token);
      return res;
    });
  }

  forgotPassword(email) {
    return this.fetch(`${this.domain}/recover/initiate`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  resetPassword({ email, password, token }) {
    return this.fetch(`${this.domain}/recover/resolve/${token}`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  updateUser(userId, body) {
    return this.fetch(`${this.domain}/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  updateTaskSettings(taskId, settings) {
    return this.fetch(`${this.domain}/tasks/${taskId}/settings`, {
      method: "PUT",
      body: JSON.stringify({settings: settings}),
    });
  }

  updateProfilePic(userId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const token = this.getToken();
    return this.fetch(`${this.domain}/users/${userId}/avatar/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? "Bearer " + token : "None",
      },
    });
  }

  getUsers() {
    return this.fetch(`${this.domain}/users`, {
      method: "GET",
    });
  }

  getAsyncBadges() {
    return this.fetch(`${this.domain}/badges/getasync`, {
      method: "GET",
    });
  }

  getTasks() {
    return this.fetch(`${this.domain}/tasks`, {
      method: "GET",
    });
  }

  submitModel(data) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("type", data.roundType);
    formData.append("taskId", data.taskId);
    formData.append("taskShortName", data.taskShortName);
    return this.fetch(`${this.domain}/models/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? "Bearer " + token : "None",
      },
    });
  }

  submitContexts(data) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("taskId", data.taskId);
    return this.fetch(`${this.domain}/contexts/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? "Bearer " + token : "None",
      },
    });
  }

  publishModel({ modelId, name, description, params, languages, license, model_card }) {
    return this.fetch(`${this.domain}/models/${modelId}/publish`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        description,
        params,
        languages,
        license,
        model_card
      }),
    });
  }

  toggleModelStatus(modelId) {
    return this.fetch(`${this.domain}/models/${modelId}/revertstatus`, {
      method: "PUT",
    });
  }

  updateModel(modelId, data) {
    return this.fetch(`${this.domain}/models/${modelId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  getTrends(taskId) {
    return this.fetch(`${this.domain}/tasks/${taskId}/trends`, {
      method: "GET",
    });
  }

  getOverallModelLeaderboard(taskId, round, limit, offset) {
    const url =
      round === "overall"
        ? `/models?limit=${limit || 10}&offset=${offset || 0}`
        : `/rounds/${round}/models?limit=${limit || 10}&offset=${offset || 0}`;
    return this.fetch(`${this.domain}/tasks/${taskId}${url}`, {
      method: "GET",
    });
  }

  getOverallUserLeaderboard(taskId, round, limit, offset) {
    const url =
      round === "overall"
        ? `/users?limit=${limit || 10}&offset=${offset || 0}`
        : `/rounds/${round}/users?limit=${limit || 10}&offset=${offset || 0}`;
    return this.fetch(`${this.domain}/tasks/${taskId}${url}`, {
      method: "GET",
    });
  }

  getUser(id, badges=false) {
    var url = `${this.domain}/users/${id}`;
    if (badges) {
      url += '/badges';
    }
    return this.fetch(url, {
      method: "GET",
    });
  }

  getTask(id) {
    return this.fetch(`${this.domain}/tasks/${id}`, {
      method: "GET",
    });
  }

  getTaskRound(id, rid) {
    return this.fetch(`${this.domain}/tasks/${id}/${rid}`, {
      method: "GET",
    });
  }

  getRandomContext(tid, rid, tags=[]) {
    return this.fetch(`${this.domain}/contexts/${tid}/${rid}?tags=${encodeURIComponent(tags.join('|'))}`, {
      method: "GET",
    });
  }

  getRandomExample(tid, rid, tags=[]) {
    return this.fetch(`${this.domain}/examples/${tid}/${rid}?tags=${encodeURIComponent(tags.join('|'))}`, {
      method: "GET",
    });
  }

  getRandomFilteredExample(tid, rid, minNumFlags, maxNumFlags, minNumDisagreements, maxNumDisagreements, tags=[]) {
    return this.fetch(`${this.domain}/examples/${tid}/${rid}/filtered/${minNumFlags}/${maxNumFlags}/${minNumDisagreements}/${maxNumDisagreements}?tags=${encodeURIComponent(tags.join('|'))}`, {
      method: "GET",
    });
  }

  getModel(modelId) {
    return this.fetch(`${this.domain}/models/${modelId}/details`, {
      method: "GET",
    });
  }

  setNotificationsSeen(userId) {
    return this.fetch(
      `${this.domain}/notifications/seen`,
      {
        method: "PUT",
      }
    );
  }
  getNotifications(userId, limit, offset) {
    return this.fetch(
      `${this.domain}/notifications?limit=${limit || 10}&offset=${
        offset || 0
      }`,
      {
        method: "GET",
      }
    );
  }

  getUserModels(userId, limit, offset) {
    return this.fetch(
      `${this.domain}/users/${userId}/models?limit=${limit || 10}&offset=${
        offset || 0
      }`,
      {
        method: "GET",
      }
    );
  }

  getModelResponse(modelUrl, { context, hypothesis, answer, insight }) {
    return this.doFetch(
      modelUrl,
      {
        method: "POST",
        body: JSON.stringify({
          context,
          hypothesis,
          answer,
          insight,
        }),
      },
      false
    );
  }

  exportData(tid, rid = null) {
    var export_link = `${this.domain}/tasks/${tid}`;
    if (rid !== null) {
      export_link += `/rounds/${rid}`;
    }
    export_link += '/export';
    return this.fetch(export_link, {
      method: "GET",
    }).then((res) => {
      res = new TextEncoder("utf-8").encode(JSON.stringify(res));
      return download(res, "export.json", "text/json");
    });
  }

  getExampleMetadata(id) {
    return this.fetch(`${this.domain}/examples/${id}/metadata`, {
      method: "GET",
    });
  }

  setExampleMetadata(id, metadata_json) {
    var obj = {};
    obj.metadata_json = JSON.stringify(metadata_json);
    return this.fetch(`${this.domain}/examples/${id}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    });
  }

  explainExample(id, type, explanation, uid = null) {
    var obj = {};
    if (type == 'example') {
      obj.example_explanation = explanation;
    } else if (type == 'model') {
      obj.model_explanation = explanation;
    }
    if (this.mode == 'mturk') {
      obj.uid = uid;
    }
    return this.fetch(`${this.domain}/examples/${id}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    });
  }

  retractExample(id, uid = null) {
    let obj = {retracted: true};
    if (this.mode == 'mturk') {
      obj.uid = uid;
    }
    return this.fetch(`${this.domain}/examples/${id}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    });
  }

  isTaskOwner(user, tid) {
    return user.task_permissions?.filter((task_permission) => tid === task_permission.tid && "owner" === task_permission.type).length > 0;
  }

  validateExample(id, label, mode, metadata = {}, uid = null) {
    let obj = {label: label, mode: mode, metadata: metadata};
    if (this.mode == 'mturk') {
      obj.uid = uid;
    }
    return this.fetch(`${this.domain}/validations/${id}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    });
  }

  flagExample(id, uid = null) {
    let obj = {flagged: true};
    if (this.mode == 'mturk') {
      obj.uid = uid;
    }
    return this.fetch(`${this.domain}/examples/${id}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    });
  }

  inspectModel(modelUrl, data) {
    return this.doFetch(
      modelUrl,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  }

  storeExample(tid, rid, uid, cid, hypothesis, target, response, metadata, tag=null) {
    return this.fetch(`${this.domain}/examples`, {
      method: "POST",
      body: JSON.stringify({
        hypothesis: hypothesis,
        tid: tid,
        rid: rid,
        cid: cid,
        uid: uid,
        target: target,
        response: response,
        metadata: metadata,
        tag: tag,
      }),
    });
  }

  loggedIn() {
    const token = this.getToken();
    if (!token) {
      //console.log("We do not have a token");
      return false;
    } else if (!!token && !this.isTokenExpired(token)) {
      //console.log("We have a valid token");
      return true;
    } else {
      //console.log("We have a token that is not longer valid - refreshing");
      return this.refreshTokenWrapper(
        function () {
          //console.log("Token refreshed");
          return true;
        },
        function () {
          console.log("Could not refresh token (loggedIn)");
          //window.location.href = '/login';
          return false;
        }
      );
    }
  }

  isTokenExpired(token) {
    try {
      const decoded = decode(token);
      if (decoded.exp < Date.now() / 1000) {
        // Checking if token is expired. N
        return true;
      } else return false;
    } catch (err) {
      return false;
    }
  }

  setToken(idToken) {
    localStorage.setItem("id_token", idToken);
  }

  getToken() {
    return localStorage.getItem("id_token");
  }

  logout() {
    localStorage.removeItem("id_token");
  }

  getCredentials() {
    //console.log(this.getToken());
    return this.getToken() ? decode(this.getToken()) : {};
  }

  refreshTokenWrapper(callback, error) {
    if (this.updating_already) {
      // TODO: Make this actually wait for an event?
      return delay(1000).then(() => {
        if (this.updating_already) {
          return this.refreshTokenWrapper(callback, error);
        }
        return callback();
      });
    } else {
      this.updating_already = true;
      return this.refreshToken()
        .then((result) => {
          this.updating_already = false;
          return callback();
        })
        .catch(() => {
          this.updating_already = false;
          return error();
        });
    }
  }

  refreshToken() {
    return this.doFetch(`${this.domain}/authenticate/refresh`, {}, true).then(
      (result) => {
        this.setToken(result.token);
      }
    );
  }

  doFetch(url, options, includeCredentials = false) {
    const token = (this.mode != 'mturk') ? this.getToken() : null;
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": token ? "Bearer " + token :
        (this.mode == "mturk" ? "turk" : "None"),
    };
    options = {
      headers,
      ...options,
    };
    if (includeCredentials) {
      options.credentials = "include";
    }
    return fetch(url, options)
      .then(this.errorHandler);
  }

  fetch(url, options) {
    const token = (this.mode != 'mturk') ? this.getToken() : null;
    if (
      !!token &&
      this.isTokenExpired(token) &&
      url !== `${this.domain}/authenticate`
    ) {
      return this.refreshTokenWrapper(
        (res) => {
          //console.log("Our token was refreshed (fetch callback)");
          return this.doFetch(url, options, {}, true);
        },
        (res) => {
          console.log("Could not refresh token (fetch)");
          var error = new Error("Could not refresh token");
          //window.location.href = '/login';
          throw error;
        }
      );
    }
    return this.doFetch(url, options, {}, true);
  }

  errorHandler(response) {
    try {
      if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response.json());
      } else {
        return Promise.resolve(response.json()).then((responseInJson) => {
          return Promise.reject(responseInJson);
        });
      }
    }
    catch (error) {
      console.log(error);
    }
  }
}
