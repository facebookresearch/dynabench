import decode from "jwt-decode";

function delay(t, v) {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, v), t);
  });
}

export default class ApiService {
  constructor(domain) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      //this.domain = domain || 'https://54.187.22.210:8081'
      this.domain = domain || "https://dev.dynabench.org:8081";
    } else {
      //this.domain = domain || 'https://54.187.22.210:8080'
      this.domain = domain || "https://www.dynabench.org:8080";
    }

    this.fetch = this.fetch.bind(this);
    this.setToken = this.setToken.bind(this);
    this.getToken = this.getToken.bind(this);
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.getCredentials = this.getCredentials.bind(this);
    this.updating_already = false;
  }

  login(email, password) {
    return this.fetch(`${this.domain}/authenticate`, {
      method: "POST",
      body: JSON.stringify({ email: email, password: password }),
    }).then((res) => {
      this.setToken(res.token);
      return Promise.resolve(res);
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
      return Promise.resolve(res);
    });
  }

  forgotPassword(email) {
    return this.fetch(`${this.domain}/recover/initiate`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  resetPassword({ email, password, token }) {
    return this.fetch(`${this.domain}/recover/resolve/${token}`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  updateUser(userId, body) {
    return this.fetch(`${this.domain}/users/${userId}/profileUpdate`, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  updateProfilePic(userId, file) {
    const formData = new FormData();
    formData.append("file", file);
    var f = this.fetch(`${this.domain}/users/${userId}/avatar/upload`, {
      method: "POST",
      body: formData,
    });
    return f.then((res) => {
      return Promise.resolve(res);
    });
  }

  getUsers() {
    return this.fetch(`${this.domain}/users`, {
      method: "GET",
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  getTasks() {
    return this.fetch(`${this.domain}/tasks`, {
      method: "GET",
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  submitModel(data) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("type", data.roundType);
    formData.append("taskId", data.taskId);
    var f = this.fetch(`${this.domain}/models/upload`, {
      method: "POST",
      body: formData,
      // headers: {
      //   Authorization: token ? "Bearer " + token : "None",
      // },
    });
    return f.then((res) => {
      return Promise.resolve(res);
    });
  }

  publishModel({ modelId, name, description }) {
    var f = this.fetch(`${this.domain}/models/${modelId}/publish`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        description,
      }),
    });
    return f.then((res) => {
      return Promise.resolve(res);
    });
  }

  unpublishModel(modelId) {
    var f = this.fetch(`${this.domain}/models/${modelId}/unpublish`, {
      method: "PUT",
    });
    return f.then((res) => {
      return Promise.resolve(res);
    });
  }

  updateModel(modelId, data) {
    var f = this.fetch(`${this.domain}/models/${modelId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return f.then((res) => {
      return Promise.resolve(res);
    });
  }

  getTrends(taskId) {
    var f = this.fetch(`${this.domain}/tasks/${taskId}/trends`, {
      method: "GET",
    });
    return f.then((res) => {
      return Promise.resolve(res);
    });
  }

  getOverallModelLeaderboard(taskId, round, limit, offset) {
    const url =
      round === "overall"
        ? `/models?limit=${limit || 10}&offset=${offset || 0}`
        : `/rounds/${round}/models?limit=${limit || 10}&offset=${offset || 0}`;
    var f = this.fetch(`${this.domain}/tasks/${taskId}${url}`, {
      method: "GET",
    });
    return f.then((res) => {
      return Promise.resolve(res);
    });
  }

  getOverallUserLeaderboard(taskId, round, limit, offset) {
    const url =
      round === "overall"
        ? `/users?limit=${limit || 10}&offset=${offset || 0}`
        : `/rounds/${round}/users?limit=${limit || 10}&offset=${offset || 0}`;
    var f = this.fetch(`${this.domain}/tasks/${taskId}${url}`, {
      method: "GET",
    });
    return f.then((res) => {
      return Promise.resolve(res);
    });
  }

  getUser(id) {
    var f = this.fetch(`${this.domain}/users/${id}`, {
      method: "GET",
    });
    return f.then((res) => {
      return Promise.resolve(res);
    });
  }

  getTask(id) {
    return this.fetch(`${this.domain}/tasks/${id}`, {
      method: "GET",
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  getTaskRound(id, rid) {
    return this.fetch(`${this.domain}/tasks/${id}/${rid}`, {
      method: "GET",
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  getRandomContext(tid, rid) {
    return this.fetch(`${this.domain}/contexts/${tid}/${rid}`, {
      method: "GET",
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  getModel(modelId) {
    return this.fetch(`${this.domain}/models/${modelId}/details`, {
      method: "GET",
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  getUserModels(userId, limit, offset) {
    return this.fetch(
      `${this.domain}/users/${userId}/models?limit=${limit || 10}&offset=${
        offset || 0
      }`,
      {
        method: "GET",
      }
    ).then((res) => {
      return Promise.resolve(res);
    });
  }

  getModelResponse(modelUrl, modelInputs) {
    return this.fetch(modelUrl, {
      method: "POST",
      body: JSON.stringify({
        context: modelInputs.context,
        hypothesis: modelInputs.hypothesis,
        answer: modelInputs.answer,
      }),
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  retractExample(id) {
    return this.fetch(`${this.domain}/examples/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        retracted: true,
      }),
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  storeExample(tid, rid, uid, cid, hypothesis, target, response, model) {
    return this.fetch(`${this.domain}/examples`, {
      method: "POST",
      body: JSON.stringify({
        hypothesis: hypothesis,
        tid: tid,
        rid: rid,
        cid: cid,
        uid: uid,
        target: target,
        // TODO: make this more specific later to reduce latency:
        // Only .prob and .signed?
        response: response,
        model: model,
      }),
    }).then((res) => {
      return Promise.resolve(res);
    });
  }

  loggedIn() {
    const token = this.getToken();
    if (!token) {
      console.log("We do not have a token");
      return false;
    } else if (!!token && !this.isTokenExpired(token)) {
      console.log("We have a valid token");
      return true;
    } else {
      console.log("We have a token that is not longer valid - refreshing");
      return this.refreshTokenWrapper(
        function () {
          console.log("Our token was refreshed (loggedIn)");
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
    console.log(this.getToken());
    return this.getToken() ? decode(this.getToken()) : {};
  }

  refreshTokenWrapper(callback, error) {
    if (this.updating_already) {
      // TODO: Make this actually wait for an event?
      return delay(1000).then(() => {
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
    const token = this.getToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: token ? "Bearer " + token : "None",
    };
    options = {
      headers,
      ...options,
    };
    if (includeCredentials) {
      options.credentials = "include";
    }
    return fetch(url, options)
      .then(this._checkStatus)
      .then((response) => response.json());
  }

  fetch(url, options) {
    const token = this.getToken();
    if (
      !!token &&
      this.isTokenExpired(token) &&
      url !== `${this.domain}/authenticate`
    ) {
      return this.refreshTokenWrapper(
        (res) => {
          console.log("Our token was refreshed (fetch callback)");
          return this.doFetch(url, options);
        },
        (res) => {
          console.log("Could not refresh token (fetch)");
          var error = new Error("Could not refresh token");
          //window.location.href = '/login';
          throw error;
        }
      );
    }
    return this.doFetch(url, options);
  }

  _checkStatus(response) {
    // raises an error in case response status is not a success
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      var error = new Error(response.statusText);
      error.response = response;
      throw error;
    }
  }
}
