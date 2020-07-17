class ApiService {
  constructor(domain) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      //this.domain = domain || 'https://54.187.22.210:8081'
      this.domain = domain || 'https://dynabench.org:8081'
    } else {
      //this.domain = domain || 'https://54.187.22.210:8080'
      this.domain = domain || 'https://dynabench.org:8080'
    }

    this.fetch = this.fetch.bind(this)
  }

  getTask(id) {
    return this.fetch(`${this.domain}/tasks/${id}`, {
      method: 'GET'
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  getRandomContext(tid, rid) {
    return this.fetch(`${this.domain}/contexts/${tid}/${rid}`, {
      method: 'GET'
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  getModelResponse(modelUrl, modelInputs) {
    return this.fetch(modelUrl, {
      method: 'POST',
      body: JSON.stringify(
        { 'context': modelInputs.context, 'hypothesis': modelInputs.hypothesis, 'answer': modelInputs.answer }
      )
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  retractExample(id, uid) {
    return this.fetch(`${this.domain}/examples/${id}`, {
      method: 'PUT',
      body: JSON.stringify(
        {
          'retracted': true,
          'uid': uid // MECHANICAL TURK WORKER ID
        }
      )
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  storeExample(tid, rid, uid, cid, hypothesis, target, response) {
    return this.fetch(`${this.domain}/examples`, {
      method: 'POST',
      body: JSON.stringify(
        {
          'hypothesis': hypothesis,
          'tid': tid,
          'rid': rid,
          'cid': cid,
          'uid': uid, // MECHANICAL TURK WORKER ID
          'target': target,
          'response': response,
          'model': 'blank' // TODO: Make this use the correct model url
        }
      )
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  doFetch(url, options) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'turk',
    }
    return fetch(url, {
      headers,
      credentials: 'include', // not sure if we always need this?
      ...options
    })
    .then(this._checkStatus)
    .then(response => response.json());
  }

  fetch(url, options) {
    return this.doFetch(url, options);
  }

  _checkStatus(response) {
    // raises an error in case response status is not a success
    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      var error = new Error(response.statusText)
      error.response = response
      throw error
    }
  }
}

export { ApiService };
